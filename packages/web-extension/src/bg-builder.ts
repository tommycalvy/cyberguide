import type { AnyFunctionsRecord } from './flux-store';
import type { SetStoreFunction } from 'solid-js/store';
import { Background } from './background';

type BackgroundMethods = {
    database: IDBDatabase;
}

export type RPC<TMethods extends AnyFunctionsRecord> = {
    methods: (bg: BackgroundMethods) => TMethods;
};

export type StoreConfig<
    TState extends object,
    TGetters extends AnyFunctionsRecord,
    TActions extends AnyFunctionsRecord
> = {
    state: TState;
    getters: (state: TState) => TGetters;
    actions: (setState: SetStoreFunction<TState>, state: TState) => TActions;
};

export type BGOptions = {
    namespace: string;
    logging: boolean;
};

// Builder implementation
export class BackgroundBuilder<
    TStores extends Record<string, StoreConfig<any, any, any>>,
    TChannelRPCs extends Record<string, RPC<any>>,
> {

    constructor(
        private storeConfigs: TStores,
        private channelRPCs: TChannelRPCs,
        private options: BGOptions
    ) {}

    setGlobalStore<
        TState extends object,
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        storeConfig: StoreConfig<TState, TGetters, TActions>
    ): BackgroundBuilder<
        TStores & Record<'global', StoreConfig<TState, TGetters, TActions>>,
        TChannelRPCs 
    > {
        return new BackgroundBuilder(
            { ...this.storeConfigs, ...{ global: storeConfig } },
            this.channelRPCs,
            this.options
        );
    }

    setTabStore<
        TState extends object, 
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        storeConfig: StoreConfig<TState, TGetters, TActions>
    ): BackgroundBuilder<
        TStores & Record<'tab', StoreConfig<TState, TGetters, TActions>>,
        TChannelRPCs 
    > {
        return new BackgroundBuilder(
            { ...this.storeConfigs, ...{ tab: storeConfig } },
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
        name: TName, storeConfig: StoreConfig<TState, TGetters, TActions>
    ): BackgroundBuilder<
        TStores & Record<TName, StoreConfig<TState, TGetters, TActions>>,
        TChannelRPCs 
    > {
        return new BackgroundBuilder(
            { ...this.storeConfigs, ...{ [name]: storeConfig } },
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
            this.storeConfigs,
            { ...this.channelRPCs, ...{ [name]: rpc } },
            this.options
        );
    }

    setNamespace(namespace: string): BackgroundBuilder<TStores, TChannelRPCs> {
        return new BackgroundBuilder(
            this.storeConfigs,
            this.channelRPCs,
            { ...this.options, ...{ namespace } }
        );
    }

    setLogging(logging: boolean): BackgroundBuilder<TStores, TChannelRPCs> {
        return new BackgroundBuilder(
            this.storeConfigs,
            this.channelRPCs,
            { ...this.options, ...{ logging } }
        );
    }

    build(): Background<TStores, TChannelRPCs> {
        return new Background(
            this.storeConfigs,
            this.channelRPCs,
            this.options
        );
    }
}
