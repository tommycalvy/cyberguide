import { 
    type AnyFunctionsRecord, createFluxStore
} from "@solid-primitives/flux-store";
import { SetStoreFunction } from "solid-js/store";




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

/*
type FluxStoreConfig<TState> = {
    state: TState;
    getters: (state: TState) => AnyFunctionsRecord;
    actions: (setState: SetStoreFunction<TState>, state: TState) => AnyFunctionsRecord;
};

interface IFluxStore<TState extends object> {
    initialState: TState;
    createMethods: {
        getters: (state: TState) => AnyFunctionsRecord;
        actions: (setState: SetStoreFunction<TState>, state: TState) => AnyFunctionsRecord;
    }
};
*/

interface BackgroundMethods {
    database: IDBDatabase;
}

interface RPC<TMethods extends AnyFunctionsRecord> {
    methods: (bg: BackgroundMethods) => TMethods;
};

interface UnknownRPC {
    methods: (bg: BackgroundMethods) => unknown;
};

type StoreDefault = {
    initialState: object;
    createMethods: {
        getters: (state: object) => AnyFunctionsRecord;
        actions: (setState: SetStoreFunction<object>, state: object) => AnyFunctionsRecord;
    }
};

type StoreConfig<
    TState extends object,
    TGetters extends AnyFunctionsRecord,
    TActions extends AnyFunctionsRecord
> = {
    initialState: TState;
    createMethods: {
        getters: (state: TState) => TGetters;
        actions: (setState: SetStoreFunction<TState>, state: TState) => TActions;
    }
};

type UnknownStore = {
    initialState: unknown;
    createMethods: {
        getters: (state: unknown) => unknown;
        actions: (setState: SetStoreFunction<unknown>, state: unknown) => unknown;
    }
};

interface UnknownChannel {
    store: UnknownStore;
    rpc: UnknownRPC;
};

// Configuration interface
type BackgroundConfig = {
    globalStore: UnknownStore | undefined;
    tabStore: UnknownStore | undefined;
    channels: Record<string, UnknownChannel>;
}

// Builder interfaces
interface IBuild<TConfig extends BackgroundConfig> {
    build(): Background<TConfig>;
}

interface ISetGlobalStore<TConfig extends BackgroundConfig> {
    setGlobalStore<
        TState extends object,
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        store: StoreConfig<TState, TGetters, TActions>    
    ): BackgroundBuilder<TConfig & { globalStore: StoreConfig<TState, TGetters, TActions> }>;
}

interface ISetTabStore<TConfig extends BackgroundConfig> {
    setTabStore<
        TState extends object, 
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        store: StoreConfig<TState, TGetters, TActions>
    ): BackgroundBuilder<TConfig & { tabStore: StoreConfig<TState, TGetters, TActions> }>;
}

interface IAddChannel<TConfig extends BackgroundConfig> {
    addChannelStore<
        TName extends string,
        TState extends object, 
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        name: TName, store: StoreConfig<TState, TGetters, TActions>
    ): BackgroundBuilder<TConfig & { channels: Record<TName, { store: StoreConfig<TState, TGetters, TActions> }> }>;

    addChannelRPC<TMethods extends AnyFunctionsRecord>(
        name: string, rpc: RPC<TMethods>
    ): BackgroundBuilder<TConfig & { channels: Record<string, { rpc: RPC<TMethods> }> }>;
}

// Builder implementation
class BackgroundBuilder<
    TConfig extends BackgroundConfig = { 
        globalStore: undefined, tabStore: undefined, channels: {}
    }
> {

    constructor(private bgConfig: TConfig) {}

    setGlobalStore<
        TState extends object,
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        store: StoreConfig<TState, TGetters, TActions>
    ): BackgroundBuilder<TConfig & { globalStore: StoreConfig<TState, TGetters, TActions> }>
    {
        return new BackgroundBuilder({ ...this.bgConfig, ...{ globalStore: store } });
    }

    setTabStore<
        TState extends object, 
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        store: StoreConfig<TState, TGetters, TActions>
    ): BackgroundBuilder<TConfig & { tabStore: StoreConfig<TState, TGetters, TActions> }>
    {
        return new BackgroundBuilder({ ...this.bgConfig, ...{ tabStore: store } });
    } 

    addChannelStore<
        TName extends string,
        TState extends object, 
        TGetters extends AnyFunctionsRecord,
        TActions extends AnyFunctionsRecord
    >(
        name: TName, store: StoreConfig<TState, TGetters, TActions>
    ): BackgroundBuilder<TConfig & { 
        channels: { [Key in keyof (TConfig['channels'] & { 
            [name in TName]: { store: StoreConfig<TState, TGetters, TActions> } 
        })]: (TConfig['channels'] & {
            [name in TName]: { store: StoreConfig<TState, TGetters, TActions> } 
        })[Key] }
    }> {
        const channels = { ...this.bgConfig.channels, ...{ [name]: { store } } };
        return new BackgroundBuilder({ ...this.bgConfig, ...{ channels } });
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

class Background<T extends BackgroundConfig> {
    constructor(private bgConfig: T) {}

    static new(): IAddChannel<false, false> & ISetGlobalStore<false> & ISetTabStore<false> { 
        return new BackgroundBuilder();
    }

    get globalStore() {
        if (!this.bgConfig.globalStore) {
            throw new Error("Global store not set.");
        }
        return createFluxStore(this.bgConfig.globalStore.state, { 
            actions: this.bgConfig.globalStore.actions,
            getters: this.bgConfig.globalStore.getters
        });
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
