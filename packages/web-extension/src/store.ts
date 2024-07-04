import { 
    type AnyFunctionsRecord, 
    type FluxStore,
    createFluxStore
} from "./flux-store";
import { SetStoreFunction } from "solid-js/store";
import type { Runtime } from 'webextension-polyfill';
/*
    *
// Configuration interface
type BackgroundConfig<
    TGlobalStore extends AnyStore | undefined = undefined, 
    TTabStore extends AnyStore | undefined = undefined,
    TChannelStores extends Record<string, AnyStore> = Record<string, never>,
    TChannelRPCs extends Record<string, AnyRPC> = Record<string, never>,
> = {
    global: TGlobalStore;
    tab: TTabStore;
    channelRPCs: TChannelRPCs;
    channelStores: TChannelStores;
    namespace: string;
    logging: boolean;
}
*/

type BackgroundMethods = {
    database: IDBDatabase;
}

type RPC<TMethods extends AnyFunctionsRecord> = {
    methods: (bg: BackgroundMethods) => TMethods;
};

type AnyRPC = RPC<any>;

type StoreConfig<
    TState extends object,
    TGetters extends AnyFunctionsRecord,
    TActions extends AnyFunctionsRecord
> = {
    state: TState;
    getters: (state: TState) => TGetters;
    actions: (setState: SetStoreFunction<TState>, state: TState) => TActions;
};

type AnyStore = StoreConfig<any, any, any>;

type GalacticStores<TName extends string> = Record<TName, FluxStore<any, any, any>>;

type Options = {
    namespace: string;
    logging: boolean;
};

// Builder implementation
class BackgroundBuilder<
    TStores extends Record<string, StoreConfig<any, any, any>>,
    TChannelRPCs extends Record<string, AnyRPC>,
> {

    constructor(
        private stores: TStores,
        private channelRPCs: TChannelRPCs,
        private options: Options
    ) {}

    setGlobalStore<
        TState extends object,
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        store: StoreConfig<TState, TGetters, TActions>
    ): BackgroundBuilder<
        TStores & Record<'global', StoreConfig<TState, TGetters, TActions>>,
        TChannelRPCs 
    > {
        return new BackgroundBuilder(
            { ...this.stores, ...{ global: store } },
            this.channelRPCs,
            this.options
        );
    }

    setTabStore<
        TState extends object, 
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        store: StoreConfig<TState, TGetters, TActions>
    ): BackgroundBuilder<
        TStores & Record<'tab', StoreConfig<TState, TGetters, TActions>>,
        TChannelRPCs 
    > {
        return new BackgroundBuilder(
            { ...this.stores, ...{ tab: store } },
            this.channelRPCs,
            this.options
        );
    } 

    addChannelStore<
        TName extends string,
        TState extends object, 
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        name: TName, store: StoreConfig<TState, TGetters, TActions>
    ): BackgroundBuilder<
        TStores & Record<TName, StoreConfig<TState, TGetters, TActions>>,
        TChannelRPCs 
    > {
        return new BackgroundBuilder(
            { ...this.stores, ...{ [name]: store } },
            this.channelRPCs,
            this.options
        );
    } 

    addChannelRPC<
        TName extends string,
        TMethods extends AnyFunctionsRecord
    >(
        name: TName, rpc: RPC<TMethods>
    ): BackgroundBuilder<
        TStores,
        TChannelRPCs & Record<TName, RPC<TMethods>>
    > {
        return new BackgroundBuilder(
            this.stores,
            { ...this.channelRPCs, ...{ [name]: rpc } },
            this.options
        );
    }

    setNamespace(namespace: string): BackgroundBuilder<TStores, TChannelRPCs> {
        return new BackgroundBuilder(
            this.stores,
            this.channelRPCs,
            { ...this.options, ...{ namespace } }
        );
    }

    setLogging(logging: boolean): BackgroundBuilder<TStores, TChannelRPCs> {
        return new BackgroundBuilder(
            this.stores,
            this.channelRPCs,
            { ...this.options, ...{ logging } }
        );
    }

    build(): Background<TStores, TChannelRPCs> {
        return new Background(
            this.stores,
            this.channelRPCs,
            this.options
        );
    }
}

type ChannelOptions = {
    tabId?: string;
    runtime: Runtime.Static;
}

class Background<
    TStores extends Record<string, StoreConfig<any, any, any>>,
    TChannelRPCs extends Record<string, AnyRPC>,
> {
    constructor(
        private stores: TStores,
        private channelRPCs: TChannelRPCs,
        private options: Options
    ) {}

    static new() { 
        return new BackgroundBuilder( 
            {},
            {},
            { namespace: 'background', logging: false }
        );
    }

    createChannelMethods<
        TName extends keyof Omit<TStores, 'global' | 'tab'>
    >(name: TName) {

        const portName = `${this.options.namespace}-${String(name)}`;

        return ({ tabId, runtime }: ChannelOptions) => {

            const connectId = tabId ? `${portName}#${tabId}` : portName;
            const port = runtime.connect({ name: connectId });

            let stores: GalacticStores<keyof TStores> | Record<string,never>;

            for (const storeName in this.stores) {
                const store = this.stores[storeName];
                const scope = storeName;
                const createActions = this.createActions(store, scope, port);
            }

            if (this.globalStore) {
                const globalActions = this.createActions(this.globalStore, 'global', port) as
                    (setState: SetStoreFunction<TGlobalStore['state']>, state: TGlobalStore['state']) => TGlobalStore['actions'];
                const globalStore = createFluxStore(this.globalStore.state, {
                    getters: this.globalStore.getters, actions: globalActions });
                stores = { ...stores, global: globalStore };
            }

            if (this.tabStore) {
                const tabActions = this.createActions(this.tabStore, 'tab', port);
                stores['tab'] = createFluxStore(this.tabStore.state, {
                    getters: this.tabStore.getters, actions: tabActions });
            }

            for (const channelStoreName in this.bgConfig.channelStores) {
                const channelStore = this.bgConfig.channelStores[channelStoreName];
                const scope = channelStoreName;
                const createActions = this.createActions(channelStore, scope, port);
            }

            port.onMessage.addListener((message) => {
                console.log(`Message received on ${portName}`, message);
                if (message.type === 'action') {
                    const { method, args } = message;
                    console.log(`Method ${method} called with args`, args);
                }
            });
        };
    }

    createActions<
        TState extends object, 
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        storeName: keyof TStores,
        port: Runtime.Port
    ): (
            setState: SetStoreFunction<TStores[typeof storeName]['state']>,
            state: TStores[typeof storeName]['state']
        ) => TStores[typeof storeName]['actions']
    {
        return (
            setState: SetStoreFunction<TStores[typeof storeName]['state']>,
            state: TStores[typeof storeName]['state']
        ) => {
            const actions = this.stores[storeName].actions(setState, state);

            const galacticActions: AnyFunctionsRecord = {};
            for (const actionName in actions) {
                const originalAction = actions[actionName];

                galacticActions[actionName] = (galactic: boolean = true, ...args) => {
                    if (galactic) {
                        port.postMessage({ 
                            type: 'action',
                            path: [storeName, actionName],
                            args,
                        });
                    }
                    return originalAction(...args);
                };
            }
            return galacticActions as TStores[typeof storeName]['actions'];
        }
    }

}

const bg = Background.new()
    .setGlobalStore({ 
        state: {
            recording: false,
        }, 
        getters: (state) => ({
            isRecording: () => state.recording,
        }), 
        actions: (setState, state) => ({
            toggleRecording: () => setState('recording', !state.recording)
        }) 
    }).setTabStore({ 
        state: {}, 
        getters: (state) => ({

        }),
        actions: (state) => ({ 
        })
    }).addChannelStore('sidebar', {
        state: {
            recording: false
        }, 
        getters: (state) => ({
            isRecording: () => state.recording
        }), 
        actions: (setState, state) => ({
            toggleRecording: () => setState('recording', !state.recording)
        }) 
    }).addChannelRPC('database', {
        methods: (bg) => ({
            get: () => {
                return bg.database;
            }
        })
    }).build();

const globalStore = bg.globalStore;
const sidebarStore = bg.getChannelStore('sidebar');
const databaseRPC = bg.getChannelRPC('database');
