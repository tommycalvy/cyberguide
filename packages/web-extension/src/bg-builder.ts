import type { AnyFunctionsRecord } from './flux-store';
import type { SetStoreFunction } from 'solid-js/store';
import { BackgroundManager } from './bg-manager';
import type { DBSchema, IDBPDatabase } from 'idb';

type BackgroundMethods<TDB extends DBSchema> = {
    db: IDBPDatabase<TDB>;
}

export type AnyAsyncFunction = (...args: any[]) => Promise<any>;

export type AnyAsyncRecord = Record<string, AnyAsyncFunction>;

/*
export type RPC<TDB extends DBSchema, TMethods extends AnyAsyncRecord> = {
    init: (bg: BackgroundMethods<TDB>) => void;
    methods: (bg: BackgroundMethods<TDB>) => TMethods;
};
*/

export type RPC<TDB extends DBSchema, TMethods extends AnyAsyncRecord> = {
    dbSchema: TDB;
    init: (bg: BackgroundMethods<TDB>) => void;
    methods: (bg: BackgroundMethods<TDB>) => TMethods;
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
    TMethods extends AnyAsyncRecord,
    TDB extends DBSchema,
> {

    constructor(
        private storeConfigs: TStores,
        private rpc: RPC<TDB, TMethods>,
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
        TMethods,
        TDB
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
        TMethods,
        TDB
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
        TMethods,
        TDB
    > {
        return new BackgroundBuilder(
            { ...this.storeConfigs, ...{ [name]: storeConfig } },
            this.rpc,
            this.options
        );
    } 

    setRPC<
        TDB extends DBSchema,
        TMethods extends AnyAsyncRecord
    >(
        rpc: RPC<TDB, TMethods>
    ): BackgroundBuilder<TStores, TMethods, TDB> {
        return new BackgroundBuilder(this.storeConfigs, rpc, this.options);
    }

    setOptions(options: BGOptions): BackgroundBuilder<TStores, TMethods, TDB> {
        return new BackgroundBuilder(this.storeConfigs, this.rpc, options);
    }

    build(): BackgroundManager<TStores, TMethods, TDB> {
        return new BackgroundManager(
            this.storeConfigs,
            this.rpc,
            this.options
        );
    }
}
