import { createFluxStore } from "./flux-store";
import type { AnyFunctionsRecord, FluxStore } from "./flux-store";
import type { SetStoreFunction } from "solid-js/store";
import type { Runtime } from 'webextension-polyfill';
import { BackgroundBuilder } from './bg-builder';
import type { StoreConfig, RPC, BGOptions, AnyAsyncRecord, AnyAsyncFunction } from './bg-builder';
import { BaseError, Result, errorResult } from './error';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

type ChannelOptions = {
    tabId?: string;
    runtime: Runtime.Static;
}

type ActionMessage = {
    type: 'action';
    storeName: string;
    actionName: string;
    args: any[];
}

interface DBMessage {
    type: 'database';
    method: string;
    args: any[];
};

interface Port {
    name: string;
    channelName: string;
    tabId: string;
    runtimePort: Runtime.Port;
}

export class BackgroundManager<
    TStores extends Record<string, StoreConfig<any, any, any>>,
    TMethods extends AnyAsyncRecord,
    TDB extends DBSchema,
> {

    constructor(
        private storeConfigs: TStores,
        private rpc: RPC<TDB, TMethods>,
        private options: BGOptions
    ) {}

    static new() { 
        return new BackgroundBuilder( 
            {},
            { dbSchema: {}, init: () => {}, methods: () => ({}) },
            { namespace: 'background', logging: false, dbVersion: 1 }
        );
    }

    createChannelMethods(channelName: string) {

        const portName = `${this.options.namespace}-${channelName}`;

        return ({ tabId, runtime }: ChannelOptions): {
            stores: { [K in keyof TStores]: FluxStore<
                TStores[K]['state'], 
                ReturnType<TStores[K]['actions']>,
                ReturnType<TStores[K]['getters']>
            > }; 
            rpc: TMethods;
        } => {

            const connectId = tabId ? `${portName}#${tabId}` : portName;
            const port = runtime.connect({ name: connectId });

            const stores: { 
                [K in keyof TStores]: FluxStore<
                    TStores[K]['state'], 
                    ReturnType<TStores[K]['actions']>,
                    ReturnType<TStores[K]['getters']>
                > } = {} as any;

            for (const storeName in this.storeConfigs) {
                const storeConfig = this.storeConfigs[storeName];
                const actions = this.createActions(storeConfig, storeName, port);
                stores[storeName] = createFluxStore(this.storeConfigs[storeName].state, {
                    getters: this.storeConfigs[storeName].getters, actions });
            }

            const rpcMethods = this.createRPCMethods(runtime); 

            port.onMessage.addListener((message) => {
                console.log(`Message received on ${portName}`, message);
                if (message.type === 'action') {
                    const { storeName, actionName, args } = message as ActionMessage;
                    console.log(`Method ${actionName} called with args`, args);
                    if (storeName in stores) {
                        if (actionName in stores[storeName].actions) {
                            stores[storeName].actions[actionName](false, ...args);
                        } else {
                            console.error(`Action ${actionName} not found in store ${storeName}`);
                        }
                    } else {
                        console.error(`Store ${storeName} not found`);
                    }
                }
            });

            return { stores, rpc: rpcMethods };
        };
    }

    createActions<
        TState extends object,
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord,
        K extends Extract<keyof TStores, string>
    >(
        store: StoreConfig<TState, TGetters, TActions>,
        storeName: K,
        port: Runtime.Port
    ): (setState: SetStoreFunction<TState>, state: TState) => TActions {

        return (setState, state) => {
            const actions = store.actions(setState, state);

            const galacticActions: TActions = {} as TActions;

            for (const actionName in actions) {
                const originalAction = actions[actionName];

                (galacticActions[actionName] as any) = (galactic: boolean = true, ...args: any[]) => {
                    if (galactic) {
                        const message: ActionMessage = { type: 'action', storeName, actionName, args };
                        port.postMessage(message);
                    }
                    return originalAction(...args);
                };
            }
            return galacticActions;
        }
    }

    createRPCMethods(runtime: Runtime.Static): TMethods {
            const methods: TMethods = {} as TMethods;

            const createMethods = (db: IDBPDatabase<TDB>) => {
                for (const method in this.rpc.methods({ db })) {
                    console.log('method', method);
                    (methods[method] as any) = (...args: any[]) => {
                        const message: DBMessage = { type: 'database', method, args };
                        return runtime.sendMessage(message);
                    }
                }
            }
            createMethods({} as IDBPDatabase<TDB>);
            return methods;
    }

    async registerDatabase(): Promise<IDBPDatabase<TDB>> {  

        const rpc = this.rpc; 
        const db = await openDB<TDB>(this.options.namespace, this.options.dbVersion || 1, {
            upgrade(db) {
                if (rpc) rpc.init({ db });
            },
        });
        return db;
    }

    createBackgroundStore() {
        return async (runtime: Runtime.Static, errorCallback: (err: BaseError) => void) => { 
            const ports = new Set<Port>(); 
            const tab_ports = new Map<string, Set<Port>>();
            const channel_ports = new Map<string, Set<Port>>();

            const db = await this.registerDatabase();

            runtime.onMessage.addListener(
                typedEventListener<DBMessage, any>(async ( message, _sender, sendResponse) => {
                if (this.rpc && message.type === 'database') {
                    const { method, args } = message;
                    const rpcMethod = this.rpc.methods({ db })[method] as AnyAsyncFunction;
                    const response = await rpcMethod(args);
                    sendResponse(response);
                }
            }));

            runtime.onConnect.addListener((runtimePort) => { 

                const newPort = this.onConnectInitializer(ports, tab_ports, channel_ports, runtimePort);
                if (!newPort.success) {
                    return errorCallback(newPort.error);
                }

                runtimePort.onMessage.addListener((message) => {
                    const result = this.messageHandler(
                        message,
                        newPort.result,
                        ports,
                        tab_ports,
                        channel_ports
                    );
                    if (!result.success) {
                        errorCallback(result.error);
                    }
                });
            });
        }
    }

    onConnectInitializer(
        ports: Set<Port>,
        tab_ports: Map<string, Set<Port>>,
        channel_ports: Map<string, Set<Port>>,
        runtimePort: Runtime.Port, 
    ): Result<Port> {
        if (this.options.logging) console.log('New connection attempt...');

        let [namespace, channelName] = runtimePort.name.split('-');
        if (namespace !== this.options.namespace) {
            const err = new BaseError('Invalid namespace', { 
                context: { namespace } 
            });
            if (this.options.logging) console.error(err);
            return { success: false, error: err };
        }

        let tabId = runtimePort.sender?.tab?.id?.toString();
        if (!tabId) {
            [channelName, tabId] = channelName.split('#');
            if (tabId && isNaN(parseFloat(tabId))) {
                const err = new BaseError( 'tabId is not a number', { context: { tabId } });
                if (this.options.logging) console.error(err);
                return { success: false, error: err };
            }
        }
        if (!tabId) {
            const err = new BaseError('No tabId in port.sender or port.name', {
                context: { portName: runtimePort.name }
            });
            if (this.options.logging) console.error(err);
            return { success: false, error: err };
        }

        const newPort: Port = { name: runtimePort.name, channelName: channelName, tabId, runtimePort };

        ports.add(newPort);

        const tab = tab_ports.get(tabId);
        if (!tab) {
            tab_ports.set(tabId, new Set([newPort]));
        } else {
            tab.add(newPort);
        }

        const channel = channel_ports.get(channelName);
        if (!channel) {
            channel_ports.set(channelName, new Set([newPort]));
        } else {
            channel.add(newPort);
        }

        if (this.options.logging) console.log(`${newPort.name} connected:`, newPort);

        return { success: true, result: newPort };
    }

    messageHandler(
        message: any,
        newPort: Port,
        ports: Set<Port>,
        tab_ports: Map<string, Set<Port>>,
        channel_ports: Map<string, Set<Port>>,
    ): Result<void> {
        if (this.options.logging) console.log(`${newPort.name} message:`, message);
        if (message.type === 'action') {
            const { storeName, actionName } = message as ActionMessage;
            let port_set: Set<Port>;
            if (storeName === 'global') {
                port_set = ports;
            } else if (storeName === 'tab') {
                const tab_port_set = tab_ports.get(newPort.tabId);
                if (!tab_port_set) {
                    return errorResult('No tab ports found', this.options.logging, { tabId: newPort.tabId });
                } else {
                    port_set = tab_port_set;
                }
            } else {
                if (channel_ports.has(storeName)) {
                    const channel_port_set = channel_ports.get(storeName);
                    if (!channel_port_set) {
                        return errorResult('No ports on channel found', this.options.logging, { storeName });
                    } else {
                        port_set = channel_port_set;
                    }
                } else {
                    return errorResult('Invalid path', this.options.logging, { storeName });
                }
            }
            port_set.forEach((port) => {
                if (port !== newPort) {
                    port.runtimePort.postMessage({ 
                        type: 'action',
                        storeName,
                        actionName,
                        args: message.args,
                    } as ActionMessage);
                }
            });
        } else if (message.type === 'database') {
            if (this.options.logging) console.log('Database rpc message:', message);
        } else {
            return errorResult('Invalid message type', this.options.logging, { message });
        }
        return { success: true, result: undefined };
    }

}

function typedEventListener<TMessage, TResponse>(listener: (
                message: TMessage,
                sender: Runtime.MessageSender,
                sendResponse: (message: TResponse) => void,
            ) => Promise<TResponse> | true | void) {
    return listener as (
                message: unknown,
                sender: Runtime.MessageSender,
                sendResponse: (message: unknown) => void,
            ) => Promise<unknown> | true | void;
};
