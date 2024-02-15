import browser from "webextension-polyfill";

type TabId = number;

interface MLPort {
    connected: boolean;
    port: browser.Runtime.Port;
    tabId: TabId;
}

interface Message {
    type: string;
    message?: string;
    data?: any;
}

type Listener = (tabId: TabId, msg: Message) => void;

type MsgType = string;

interface MLChannel {
    listeners: Map<MsgType, Listener>;
    ports: Map<TabId, MLPort>;
}

type GPSuccess = (port: browser.Runtime.Port) => void;
type Failure = (err: Error) => void;

/** Class that creates a runtime.onConnect listener and returns the ports */
class MessageListener {
    #channels: Map<string, MLChannel>;

    constructor() {
        this.#channels = new Map();
        this.startListening((err) => {
            console.error(err);
        });
    }

    startListening(f: Failure) {
        browser.runtime.onConnect.addListener((port) => {
            const channelName = port.name;
            const tabId = port.sender?.tab?.id;
            if (!tabId) {
                f(new Error(`No tabId for port with channelName: ${channelName}`));
                return;
            }
            console.log(`port with name: ${channelName} connected from tabId: ${tabId}`);
            const channel = this.#channels.get(channelName);
            if (!channel) {
                f(new Error(`No listeners for channel: ${channelName}`));
                return;
            }
            const p = channel.ports.get(tabId);
            if (p) {
                if (!p.connected || !p.port) {
                    p.port = port;
                    p.connected = true;
                }
            } else {
                const newPort: MLPort = {
                    connected: true,
                    port: port,
                    tabId: tabId,
                };
                channel.ports.set(tabId, newPort);
            }
            port.onMessage.addListener((msg) => {
                if (!msg.type) {
                    f(new Error(`No msg type from channel: ${channelName} and tabId: ${tabId}`));
                    return;
                }
                console.log(channelName, ": ", msg.type);
                const listener = channel.listeners.get(msg.type);
                if (listener) {
                    listener(tabId, msg);
                } else {
                    f(new Error(`No listener for msg type: ${msg.type} and channel: ${channelName}`));
                }
            });
            port.onDisconnect.addListener(() => {
                console.log(`port on channel: ${channelName} disconnected from tabId: ${tabId}`);
                const p = channel.ports.get(tabId);
                if (p) {
                    p.connected = false;
                } else {
                    f(new Error(`No port with tabId: ${tabId} for channel: ${channelName}`));
                }
            });
        });
    }

    //TODO: add Global Listener so that all ports can listen to a message

    addChannel(channelName: string) {
        let c: MLChannel = {
            listeners: new Map(),
            ports: new Map(),
        };
        this.#channels.set(channelName, c);
    }


    getPort(channelName: string, tabId: number, success: GPSuccess, f: Failure): void {
        const c = this.#channels.get(channelName);
        if (!c) {
            f(new Error(`No channel with name: ${channelName}`));
            return;
        }
        const p = c.ports.get(tabId);
        if (!p) {
            f(new Error(`No port with tabId: ${tabId}`));
            return;
        }
        if (!p.port) {
            f(new Error(`Port is null with tabId: ${tabId} and channelName: ${channelName}`));
        } else if (!p.connected) {
            f(new Error(`Port with tabId: ${tabId} and channelName: ${channelName} is not connected`));
        } else {
            success(p.port);
        }
    }

    addMsgListener(channelName: string, msgType: string, listener: Listener, f: Failure) {
        const c = this.#channels.get(channelName);
        if (c) {
            c.listeners.set(msgType, listener);
        } else {
            f(new Error(`No port with channel: ${channelName}`));
        }
    }
}

class Channel {

    #channelName: string;
    #msgListener: MessageListener;

    constructor(channelName: string, msgListener: MessageListener) {
        this.#channelName = channelName;
        this.#msgListener = msgListener;
        this.#msgListener.addChannel(this.#channelName);
    }

    onMessage(msgType: string, listener: Listener) {
        this.#msgListener.addMsgListener(this.#channelName, msgType, listener, (err) => {
            console.error(err);
        });
    }

    postMessage(tabId: TabId, msg: Message) {
        this.#msgListener.getPort(this.#channelName, tabId, (port) => {
            port.postMessage(msg);
        }, (err) => {
            console.error(err);
        });
    }
}

export { MessageListener, Channel };
