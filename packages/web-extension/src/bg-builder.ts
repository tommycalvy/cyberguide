import type { AnyFunctionsRecord } from './flux-store';
import type { SetStoreFunction } from 'solid-js/store';
import { BackgroundManager } from './bg-manager';

type BackgroundMethods = {
    db: IDBDatabase;
}

export type RPC<TMethods extends AnyFunctionsRecord> = {
    init: (bg: BackgroundMethods) => void;
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
    dbVersion?: number;
};

// Builder implementation
export class BackgroundBuilder<
    TStores extends Record<string, StoreConfig<any, any, any>>,
    TRPC extends RPC<any>,
> {

    constructor(
        private storeConfigs: TStores,
        private rpc: TRPC | undefined,
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
        TRPC 
    > {
        return new BackgroundBuilder(
            { ...this.storeConfigs, ...{ global: storeConfig } },
            this.rpc,
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
        TRPC 
    > {
        return new BackgroundBuilder(
            { ...this.storeConfigs, ...{ tab: storeConfig } },
            this.rpc,
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
        TRPC 
    > {
        return new BackgroundBuilder(
            { ...this.storeConfigs, ...{ [name]: storeConfig } },
            this.rpc,
            this.options
        );
    } 

    setRPC<TMethods extends AnyFunctionsRecord>(
        rpc: RPC<TMethods>
    ): BackgroundBuilder<TStores, RPC<TMethods>> {
        return new BackgroundBuilder(this.storeConfigs, rpc, this.options);
    }

    setOptions(options: BGOptions): BackgroundBuilder<TStores, TRPC> {
        return new BackgroundBuilder(this.storeConfigs, this.rpc, options);
    }

    build(): BackgroundManager<TStores, TRPC> {
        return new BackgroundManager(
            this.storeConfigs,
            this.rpc,
            this.options
        );
    }
}
