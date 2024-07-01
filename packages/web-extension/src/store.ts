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

/*
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

// Configuration interface
interface BackgroundConfig {
    globalStore?: StoreDefault;
    tabStore?: StoreDefault;
    channels: Record<string, Channel>;
}

// Builder interfaces
interface IBuild {
    build(): Background;
}

interface ISetGlobalStore<TS extends boolean> {
    setGlobalStore<
        TState extends object, 
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        store: FluxStore<TState, TGetters, TActions>
    ): TS extends true ? IBuild & IAddChannel<true, true> : 
        IAddChannel<true, false> & ISetTabStore<true>;
}

interface ISetTabStore<GS extends boolean> {
    setTabStore<
        TState extends object, 
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        store: FluxStore<TState, TGetters, TActions>
    ): GS extends true ? IBuild & IAddChannel<true, true> : 
        IAddChannel<false, true> & ISetGlobalStore<true>;
}

interface IAddChannel<GS extends boolean, TS extends boolean> {
    addChannelStore<
        TState extends object, 
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        name: string, store: FluxStore<TState, TGetters, TActions>
    ): GS & TS extends true ? IBuild & IAddChannel<true, true>: 
            GS extends true ? IAddChannel<true, false> & ISetTabStore<true> : 
            TS extends true ? IAddChannel<false, true> & ISetGlobalStore<true> :
            IAddChannel<false, false> & ISetGlobalStore<false> & ISetTabStore<false>;
    addChannelRPC<TMethods extends AnyFunctionsRecord>(
        name: string, rpc: RPC<TMethods>
    ): GS & TS extends true ? IBuild & IAddChannel<true, true>: 
            GS extends true ? IAddChannel<true, false> & ISetTabStore<true> : 
            TS extends true ? IAddChannel<false, true> & ISetGlobalStore<true> :
            IAddChannel<false, false> & ISetGlobalStore<false> & ISetTabStore<false>;
}

// Builder implementation
class BackgroundBuilder<GS extends boolean = false, TS extends boolean = false>
    implements IBuild, IAddChannel<GS, TS>, ISetGlobalStore<TS>, ISetTabStore<GS> {

    constructor(private bgConfig: BackgroundConfig = { channels: {} }) {}

    setGlobalStore<
        TState extends object, 
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        store: FluxStore<TState, TGetters, TActions>
    ): TS extends true ? IBuild & IAddChannel<true, true> : 
        IAddChannel<true, false> & ISetTabStore<true>
    {
        this.bgConfig.globalStore = store;
        return new BackgroundBuilder<true, TS>(this.bgConfig) as any;
    }

    setTabStore<
        TState extends object, 
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        store: FluxStore<TState, TGetters, TActions>
    ): GS extends true ? IBuild & IAddChannel<true, true> : 
        IAddChannel<false, true> & ISetGlobalStore<true>
    {
        this.bgConfig.tabStore = store;
        return new BackgroundBuilder<GS, true>(this.bgConfig) as any;
    }

    addChannelStore<
        TState extends object, 
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        name: string, store: FluxStore<TState, TGetters, TActions>
    ): GS & TS extends true ? IBuild & IAddChannel<true, true>: 
            GS extends true ? IAddChannel<true, false> & ISetTabStore<true> : 
            TS extends true ? IAddChannel<false, true> & ISetGlobalStore<true> :
            IAddChannel<false, false> & ISetGlobalStore<false> & ISetTabStore<false> 
    {
        this.bgConfig.channels[name].store = store;
        return new BackgroundBuilder<GS, TS>(this.bgConfig) as any;
    }

    addChannelRPC<TMethods extends AnyFunctionsRecord>(
        name: string, rpc: RPC<TMethods>
    ): GS & TS extends true ? IBuild & IAddChannel<true, true>: 
            GS extends true ? IAddChannel<true, false> & ISetTabStore<true> : 
            TS extends true ? IAddChannel<false, true> & ISetGlobalStore<true> :
            IAddChannel<false, false> & ISetGlobalStore<false> & ISetTabStore<false> 
    {
        this.bgConfig.channels[name].rpc = rpc;
        return new BackgroundBuilder<GS, TS>(this.bgConfig) as any;
    }

    build() {
        if (!this.bgConfig.globalStore && !this.bgConfig.tabStore) {
            throw new Error("Either globalStore or tabStore must be set before building.");
        }
        return new Background(this.bgConfig);
    }
}

class Background {
    constructor(private bgConfig: BackgroundConfig) {}

    static new(): IAddChannel<false, false> & ISetGlobalStore<false> & ISetTabStore<false> { 
        return new BackgroundBuilder();
    }

    get globalStore() {
        return this.bgConfig.globalStore;
    }

    get tabStore() {
        return this.bgConfig.tabStore;
    }

    get channels() {
        return this.bgConfig.channels;
    }
}

const bg = Background.new()
    .setGlobalStore({ state: {}, getters: {}, actions: {} })
    .setTabStore({ state: {}, getters: {}, actions: {} })
    .addChannelStore('sidebar', { state: {}, getters: {}, actions: {} })
    .addChannelRPC('guidecreator', { methods: () => ({}) })
    .build();
