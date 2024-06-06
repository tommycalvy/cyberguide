import { browser } from 'wxt/browser';
import type { Runtime } from 'webextension-polyfill';
import type { StoreNode } from 'solid-js/store';
import { createStore } from 'solid-js/store';
import type { SetStoreFunction } from "solid-js/store";
import type { StoreSetter } from 'solid-js/store';
import { AnyFunctionsRecord, createFluxStore } from './flux-store';
import { captureStoreUpdates } from '@solid-primitives/deep';
import { createEffect } from 'solid-js';


interface GalacticState {
    global: object;
    tab: object;
    [channel: string]: object;
}


interface GalacticMethods {
    global: AnyFunctionsRecord;
    tab: AnyFunctionsRecord;
    [channel: string]: AnyFunctionsRecord;
}

interface FluxStore<
    TState extends object,
    TActions extends AnyFunctionsRecord,
    TGetters extends AnyFunctionsRecord,
> {
    state: TState;
    getters?: (state: TState) => TGetters;
    actions: (setState: SetStoreFunction<TState>, state: TState) => TActions;
}

interface GalacticFluxStore<
    TState extends GalacticState,
    TActions extends GalacticMethods,
    TGetters extends GalacticMethods,
> {
    state: TState;
    getters?: (state: TState) => TGetters;
    actions: (setState: SetStoreFunction<TState>, state: TState) => TActions;
}

interface ChannelState extends GalacticState {
    private: object;
}

interface ChannelMethods {
    global: AnyFunctionsRecord;
    tab: AnyFunctionsRecord;
    [channel: string]: AnyFunctionsRecord;
    private: AnyFunctionsRecord;
}

interface ChannelFluxStore<
    TState extends ChannelState,
    TActions extends ChannelMethods,
    TGetters extends ChannelMethods,
> {
    state: TState;
    getters?: (state: TState) => TGetters;
    actions: (setState: SetStoreFunction<TState>, state: TState) => TActions;
}


interface GalaticStoreOptions<
    TState extends GalacticState,
    TActions extends GalacticMethods,
    TGetters extends GalacticMethods,
> {
    namespace: string;
    runtime: Runtime.Static;
    store: GalacticFluxStore<TState, TActions, TGetters>;
}

interface ChannelStoreOptions<
    TState extends object,
    TActions extends AnyFunctionsRecord,
    TGetters extends AnyFunctionsRecord,
> {
    channelName: string;
    unshared: FluxStore<TState, TActions, TGetters>;
}

interface ChannelOptions {
    tabId?: number;
}

export class GalacticStore<
    TGState extends GalacticState,
    TGActions extends GalacticMethods,
    TGGetters extends GalacticMethods,
> {
    _namespace: string;
    _runtime: Runtime.Static;
    _store: GalacticFluxStore<TGState, TGActions, TGGetters>;

    constructor({ namespace, runtime, store }: GalaticStoreOptions<TGState, TGActions, TGGetters>) {
        this._namespace = namespace;
        this._runtime = runtime;
        this._store = store;
    }

    createChannelStore<
        TPState extends object,
        TPActions extends AnyFunctionsRecord,
        TPGetters extends AnyFunctionsRecord,
    >(
        { channelName, unshared }: ChannelStoreOptions<TPState, TPActions, TPGetters>
    ) {
        const portName = `${this._namespace}-${channelName}`;


        return ({ tabId }: ChannelOptions) => {
            const connectId = tabId ? portName + `#${tabId}` : portName;

            const port = this._runtime.connect(connectId);

            const modifiedActions = (setState: SetStoreFunction<TGState>, state: TGState) => {
                const originalActions = this._store.actions(setState, state).global;
                const newActions: AnyFunctionsRecord = {};
                for (const actionName in originalActions) {
                    const originalAction = originalActions[actionName];

                    newActions[actionName] = (...args) => {
                        port.postMessage(`Action ${actionName} called with arguments: ${JSON.stringify(args)}`);
                        return originalAction(...args);
                    };
                }
                return newActions;
            };

            createMethods.actions = modifiedActions;

            const galacticState = createFluxStore(initialChannelState, createMethods);




            port.onMessage.addListener((message, runtimePort) => {
                if (defaultStore[message.type]) {
                    setStore(message.type, message.data);
                }
            });

        };

    }

    createBackgroundStore(): () => void {
        return () => { };
    }
}

const galacticStore = new GalacticStore({
    namespace: 'galactic',
    runtime: browser.runtime,
    initialGalacticState: {
        global: {},
        tab: {},
    },
});

galacticStore.createChannelStore({
    channelName: 'sidebar',
    initialChannelState: {
        global: {},
        tab: {},
        'sidebar': {},
        private: {}
    },
    createMethods: {
        getters: (state) => ({
            getSidebar: () => state.sidebar,
        }),
        actions: (setState) => ({
            setSidebar: (data) => setState('sidebar', data),
            startRecording: () => setState('tab', { recording: true }),
        })
    }
});
