// TODO: Just use solidjs primitives
import type { Runtime } from 'webextension-polyfill';
import type { StoreNode } from 'solid-js/store';
import { createStore } from 'solid-js/store';
import { createEffect } from 'solid-js';
type ExtensionScript = 'content' | 'sidebar';

type ProtocolId = string;

interface Data<T = any> {
    (data?: T): void;
};

interface Protocol { 
    [key: string]: Data;
};

interface Channel {
    receiving: Set<string>;
    sending: Set<string>;
}

interface ChannelOptions {
    tabId?: number;
}

interface ExtensionStore {
    global: any;
    tab: any;
    [channel: string]: any;
}

interface GalaticStoreOptions {
    namespace: string;
    runtime: Runtime.Static;
}

export class GalacticStore {
    _namespace: string;
    _runtime: Runtime.Static;
    _channels: Record<string, Channel> = {};
    _protocols: Record<ProtocolId, Protocol> = {};
    _globalStore: StoreNode | null = null;
    _tabStore: StoreNode | null = null;
    _channelStores: Record<string, StoreNode> = {};

    constructor({ namespace, runtime }: GalaticStoreOptions) {
        this._namespace = namespace;
        this._runtime = runtime;
    }

    addGlobalStore<T extends StoreNode>(state: T) {
        this._globalStore = state;
    }

    addTabStore<T extends StoreNode>(state: T) {
        this._tabStore = state;
    }

    addChannelStore<T extends StoreNode>(channelName: string, state: T) {
        this._channelStores[channelName] = state;
    }

    createChannelStore(channelName: string) {

        const portName = `${this._namespace}-${channelName}`;

        return (options: ChannelOptions = {}) => {
            const connectId = options.tabId ? portName + `#${options.tabId}` : portName;

            const [store, setStore] = createStore({ 
                ...this._globalStore,
                ...this._tabStore,
                ...this._channelStores[channelName],
            });

            const listeners = {};

            const port = this._runtime.connect(connectId);

            port.onMessage.addListener((message, runtimePort) => {
                if (store[message.type]) {
                    setStore(message.type, message.data);
                }
            });


        };

    }

    register(): () => void {
        return () => {
            this.messageProtocols.register();
        };
    }
}
