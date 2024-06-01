// TODO: Just use solidjs primitives
import type { Runtime } from 'webextension-polyfill';
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

export class Messaging {
    _namespace: string;
    _runtime: Runtime.Static;
    _channels: Record<string, Channel> = {};
    _protocols: Record<ProtocolId, Protocol> = {};

    constructor(namespace: string, runtime: Runtime.Static) {
        this._namespace = namespace;
        this._runtime = runtime;
    }

    addProtocol(id: ProtocolId, protocol: Protocol): ProtocolId | null {
        if (this._protocols[id]) return null;
        this._protocols[id] = protocol;
        return id;
    }

    createChannel(channelName: string) {
        if (this._channels[channelName]) return null;

        const channel: Channel = { receiving: new Set(), sending: new Set() };
        this._channels[channelName] = channel;


        const portName = `${this._namespace}-${channelName}`;

        const newChannel = (options: ChannelOptions = {}) => {
            const connectId = options.tabId ? portName + `#${options.tabId}` : portName;

            const listeners = {};

            const port = this._runtime.connect(connectId);

            port.onMessage.addListener((message, runtimePort) => {
                if (listeners[`on${message.type}`]) {
                    listeners[`on${message.type}`](message);
                }
            });

            const commands = {};
            channel.sending.forEach((protocolId) => {
                const protocolEntries = Object.entries(this._protocols[protocolId]);
                commands[protocolId] = protocolEntries.reduce((acc, [commandName, data]) => {
                    acc[commandName] = (data?: typeof data) => {
                        port.postMessage({
                            type: commandName,
                            data,
                        });
                    };
                    return acc;
                });
            });

            const handlers = {};
            channel.receiving.forEach((protocolId) => {
                const protocolEntries = Object.entries(this._protocols[protocolId]);
                handlers[protocolId] = protocolEntries.reduce((acc, [handlerName, data]) => {
                    acc[handlerName] = (listener: (data?: typeof data) => void) => {
                        listeners[`on${handlerName}`] = listener; 
                    };
                    return acc;
                });
            });
            return { ...commands, ...handlers };

        };

        const channelBuilder = {
            receives: (protocolId: ProtocolId) => {
                channel.receiving.add(protocolId);
                return channelBuilder;
            },
            sends: (protocolId: ProtocolId) => {
                channel.sending.add(protocolId);
                return channelBuilder;
            },
            build: () => newChannel,
        };

        return channelBuilder;    
    }

    register(): () => void {
        return () => {
            this.messageProtocols.register();
        };
    }
}
