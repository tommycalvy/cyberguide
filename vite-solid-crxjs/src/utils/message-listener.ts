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
type GPFailure = (error: Error) => void;

/** Class that creates a runtime.onConnect listener and returns the ports */
class MessageListener {
    #channels: Map<string, MLChannel>;
    #logging: boolean;
    
    constructor(logging = false) {
        this.#logging = logging;
        this.#channels = new Map();

        browser.runtime.onConnect.addListener((port) => {
            const channelName = port.name;
            const tabId = port.sender?.tab?.id;
            if (tabId) {
                if (this.#logging) console.log(`port with name: ${channelName} connected from tabId: ${tabId}`);
                const channel = this.#channels.get(channelName);
                if (channel) {
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
                    port.onMessage.addListener((msg) =>  {
                        if (msg.type) {
                            if (this.#logging) console.log(channelName, ": ", msg.type);
                            const listener = channel.listeners.get(msg.type);
                            if (listener) {
                                listener(tabId, msg);
                            } else if (this.#logging) {
                                console.error("No listener for msg type:", msg.type);
                            }
                        } else if (this.#logging) {
                            console.error("No msg type from port: ", port.name);
                        }
                    });
                    port.onDisconnect.addListener(() => {
                        if (this.#logging) console.log(`port on channel: ${channelName} disconnected from tabId: ${tabId}`);
                        const p = channel.ports.get(tabId);
                        if (p) {
                            p.connected = false;
                        } else if (this.#logging) {
                            console.error(`No port with tabId: ${tabId} for channel: ${channelName}`);
                        }
                    }); 
                } else if (this.#logging) {
                    console.error("No listeners for channel: ", port.name);
                }
            } else if (this.#logging) {
                console.error("No tabId for port with channelName: ", port.name);
            }
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

   
    getPort(channelName: string, tabId: number, success: GPSuccess, failure: GPFailure): void  {
        const c = this.#channels.get(channelName);
        if (c) {
            const p = c.ports.get(tabId);
            if (p) {
                if (!p.port) {
                    failure(new Error(`Port is null with tabId: ${tabId} and channelName: ${channelName}`));
                } else if (!p.connected) {
                    failure(new Error(`Port with tabId: ${tabId} and channelName: ${channelName} is not connected`));
                } else {
                    success(p.port);
                }
            } else {
                failure(new Error(`No port with tabId: ${tabId}`));
            }   
        } else {
            failure(new Error(`No channel with name: ${channelName}`));
        }
    }

    addMsgListener(channelName: string, msgType: string, listener: Listener) {
        const c = this.#channels.get(channelName);
        if (c) {
            c.listeners.set(msgType, listener);
        } else {
            throw new Error(`No port with channel: ${channelName}`);
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
        this.#msgListener.addMsgListener(this.#channelName, msgType, listener);
    }

    postMessage(tabId: TabId, msg: Message) {
        this.#msgListener.getPort(this.#channelName, tabId, (port) => {
            port.postMessage(msg);
        }, (error) => {
            console.error(error);
        });
    }
}

export { MessageListener, Channel };
