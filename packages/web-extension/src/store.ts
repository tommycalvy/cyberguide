/*
import { 
    type FluxStore, type AnyFunctionsRecord, createFluxStore
} from "@solid-primitives/flux-store";

interface BackgroundMethods {
    database: IDBDatabase;
}

interface RPC<TMethods extends AnyFunctionsRecord> {
    methods: (bg: BackgroundMethods) => TMethods;
};

type rpcDefault = RPC<AnyFunctionsRecord>;

type StoreDefault = FluxStore<object, AnyFunctionsRecord, AnyFunctionsRecord>;

interface Channel {
    store: StoreDefault | undefined;
    rpc: rpcDefault | undefined;
};


interface IBackgroundBuilder {
    setGlobalStore<
        TState extends object,
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(store: FluxStore<TState, TGetters, TActions>): IBackgroundBuilder;
    setTabStore<
        TState extends object,
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(store: FluxStore<TState, TGetters, TActions>): IBackgroundBuilder;
    addChannelStore<
        TState extends object,
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(name: string, store: FluxStore<TState, TGetters, TActions>): IBackgroundBuilder;
    addChannelRPC<TMethods extends AnyFunctionsRecord>(
        name: string,
        rpc: RPC<TMethods>
    ): IBackgroundBuilder;
    build(): BackgroundConfig;
}

interface BackgroundConfig {
    globalStore: StoreDefault;
    tabStore: StoreDefault;
    channels: Record<string, Channel>;
};

interface IBuild {
    build(): BackgroundConfig;
};

interface IAddChannel<Supplied extends Partial<BackgroundConfig>> {
    addChannelStore<
        TState extends object,
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(name: string, store: FluxStore<TState, TGetters, TActions>):
        Omit<BackgroundConfig, keyof Supplied> extends never 
        ? IBuild & IAddChannel<Supplied>
        : IAddChannel<Supplied> & ISetGlobalStore<Supplied> & ISetTabStore<Supplied>;
    ;
    addChannelRPC<TMethods extends AnyFunctionsRecord>(
        name: string,
        rpc: RPC<TMethods>
    ): IBuild;
}

interface ISetGlobalStore {
    setGlobalStore<
        TState extends object,
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(store: FluxStore<TState, TGetters, TActions>): IBackgroundBuilder;
}

interface ISetTabStore {
    setTabStore<
        TState extends object,
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(store: FluxStore<TState, TGetters, TActions>): IBackgroundBuilder;
}


class BackgroundBuilder<Supplied> {
    constructor(private bgConfig: Partial<BackgroundConfig>) {}

    setGlobalStore<
        TState extends object,
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(store: FluxStore<TState, TGetters, TActions>) {
        this.bgConfig.globalStore = store;
        return this;
    }

    setTabStore<
        TState extends object,
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(store: FluxStore<TState, TGetters, TActions>) {
        this.bgConfig.tabStore = store;
        return this;
    }

    addChannelStore<
        TState extends object,
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(name: string, store: FluxStore<TState, TGetters, TActions>) {
        if (this.bgConfig.channels[name]) {
            this.bgConfig.channels[name].store = store;
        } else {
            this.bgConfig.channels[name] = { store, rpc: undefined };
        }
        return this;
    }

    addChannelRPC<TMethods extends AnyFunctionsRecord>(
        name: string,
        rpc: RPC<TMethods>
    ) {
        if (this.bgConfig.channels[name]) {
            this.bgConfig.channels[name].rpc = rpc;
        } else {
            this.bgConfig.channels[name] = { store: undefined, rpc };
        }
        return this;
    }
}
*/
// Helper type for function records
type AnyFunctionsRecord = Record<string, Function>;

// Dummy interfaces for Store and RPC (provide actual definitions)
interface StoreDefault {}
interface FluxStore<TState, TGetters, TActions> {}
interface RPC<TMethods> {}

// Configuration interface
interface BackgroundConfig {
    globalStore?: StoreDefault;
    tabStore?: StoreDefault;
    channels: Record<string, { store?: FluxStore<any, any, any>, rpc?: RPC<any> }>;
}

// Builder interfaces
interface IBuild {
    build(): BackgroundConfig;
}

interface ISetGlobalStore<T extends boolean = false> {
    setGlobalStore<TState, TGetters, TActions>(
        store: FluxStore<TState, TGetters, TActions>
    ): T extends true ? never : IBackgroundBuilder<true>;
}

interface ISetTabStore<T extends boolean = false> {
    setTabStore<TState, TGetters, TActions>(
        store: FluxStore<TState, TGetters, TActions>
    ): T extends true ? never : IBackgroundBuilder<false, true>;
}

interface IAddChannel {
    addChannelStore<TState, TGetters, TActions>(
        name: string, store: FluxStore<TState, TGetters, TActions>
    ): IBackgroundBuilder;
    addChannelRPC<TMethods>(name: string, rpc: RPC<TMethods>): IBackgroundBuilder;
}

// The comprehensive builder interface
interface IBackgroundBuilder<GS extends boolean = false, TS extends boolean = false> 
    extends IBuild, IAddChannel, ISetGlobalStore<GS>, ISetTabStore<TS> {}

// Builder implementation
class BackgroundBuilder implements IBackgroundBuilder {
    private bgConfig: BackgroundConfig = { channels: {} };

    constructor() {}

    setGlobalStore<TState, TGetters, TActions>(
        store: FluxStore<TState, TGetters, TActions>
    ) {
        this.bgConfig.globalStore = store;
        return new BackgroundBuilder();
    }

    setTabStore<TState, TGetters, TActions>(store: FluxStore<TState, TGetters, TActions>): this {
        this.bgConfig.tabStore = store;
        return this;
    }

    addChannelStore<TState, TGetters, TActions>(name: string, store: FluxStore<TState, TGetters, TActions>): this {
        this.bgConfig.channels[name] = { ...this.bgConfig.channels[name], store };
        return this;
    }

    addChannelRPC<TMethods>(name: string, rpc: RPC<TMethods>): this {
        this.bgConfig.channels[name] = { ...this.bgConfig.channels[name], rpc };
        return this;
    }

    build(): BackgroundConfig {
        if (!this.bgConfig.globalStore && !this.bgConfig.tabStore) {
            throw new Error("Either globalStore or tabStore must be set before building.");
        }
        return this.bgConfig;
    }
}

