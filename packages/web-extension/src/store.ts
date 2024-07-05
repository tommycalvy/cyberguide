import { 
    type AnyFunctionsRecord, 
    type FluxStore,
    createFluxStore
} from "./flux-store";
import { SetStoreFunction } from "solid-js/store";
import type { Runtime } from 'webextension-polyfill';

type BackgroundMethods = {
    database: IDBDatabase;
}

type RPC<TMethods extends AnyFunctionsRecord> = {
    methods: (bg: BackgroundMethods) => TMethods;
};

type StoreConfig<
    TState extends object,
    TGetters extends AnyFunctionsRecord,
    TActions extends AnyFunctionsRecord
> = {
    state: TState;
    getters: (state: TState) => TGetters;
    actions: (setState: SetStoreFunction<TState>, state: TState) => TActions;
};


/*
    type Store<
TState extends object,
TGetters extends AnyFunctionsRecord,
TActions extends AnyFunctionsRecord
> = {
    state: TState;
    getters: TGetters;
    actions: TActions;
};
type GalacticStores<TStores> = {
    [K in keyof TStores]: FluxStore<TStores[K]['state'], TStores[K]['getters'], TStores[K]['actions']>
};

*/
type Options = {
    namespace: string;
    logging: boolean;
};

// Builder implementation
class BackgroundBuilder<
    TStores extends Record<string, StoreConfig<any, any, any>>,
    TChannelRPCs extends Record<string, RPC<any>>,
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
    TChannelRPCs extends Record<string, RPC<any>>,
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

    createChannelMethods(channelName: string) {

        const portName = `${this.options.namespace}-${channelName}`;

        return ({ tabId, runtime }: ChannelOptions) => {

            const connectId = tabId ? `${portName}#${tabId}` : portName;
            const port = runtime.connect({ name: connectId });

            const stores: { 
                [K in keyof TStores]: FluxStore<
                    TStores[K]['state'], 
                    TStores[K]['getters'],
                    TStores[K]['actions']
                > } | Record<string, never> = {};

            for (const storeName in this.stores) {
                const actions = this.createActions(storeName, port);
                stores[storeName] = createFluxStore(this.stores[storeName].state, {
                    getters: this.stores[storeName].getters, actions });
            }

            port.onMessage.addListener((message) => {
                console.log(`Message received on ${portName}`, message);
                if (message.type === 'action') {
                    const { method, args } = message;
                    console.log(`Method ${method} called with args`, args);
                }
            });

            return stores;
        };
    }

    createActions<K extends keyof TStores>(
        storeName: K,
        port: Runtime.Port
    ): (
            setState: SetStoreFunction<TStores[K]['state']>,
            state: TStores[K]['state']
        ) => ReturnType<TStores[K]['actions']>
    {
        return (
            setState: SetStoreFunction<TStores[K]['state']>,
            state: TStores[K]['state']
        ): ReturnType<TStores[K]['actions']> => {
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
            return galacticActions;
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
