import browser from "webextension-polyfill";
import type { Message } from "./types";

type MsgListener = (msg: Message, port: browser.Runtime.Port) => void;
type PortListener = (port: browser.Runtime.Port) => void;
type Failure = (err: Error) => void;

interface MPort {
    port: browser.Runtime.Port;
    name: string;
}

interface MChannel {
    ports: Map<string, MPort>;
    msgListeners: Map<string, MsgListener>;
    dcdListener: PortListener | null;
    cntListener: PortListener | null;
}

/** Class that creates a runtime.onConnect listener and returns the ports */
class MessageListener {
    #channels: Map<string, MChannel>;

    constructor() {
        this.#channels = new Map();
        this.startListening();
    }

    startListening() {
        browser.runtime.onConnect.addListener((port) => {
            const portName = port.name;
            const channelName = portName.substring(0, 2);
            console.log(portName, "connected");
            const channel = this.#channels.get(channelName);
            if (!channel) {
                console.warn(`No listeners for channel: ${channelName}`);
                return;
            }
            const p = channel.ports.get(portName);
            if (p) {
                console.warn(`Port with name: ${portName} already exists`);
                port.disconnect();
                return;
            }
            const mport: MPort = {
                port: port,
                name: portName,
            };
            channel.ports.set(portName, mport);
            const cntListener = channel.cntListener;
            if (cntListener) {
                cntListener(port);
            } else {
                console.warn(`No connect listener for channel: ${channelName}`);
            }

            port.onMessage.addListener((msg, port) => {
                if (!msg.type) {
                    console.warn(`No msg type from port: ${port.name}`);
                    return;
                }
                console.log(channelName, ": ", msg.type);
                const listener = channel.msgListeners.get(msg.type);
                if (listener) {
                    listener(msg, port);
                } else {
                    console.warn(`No listener for msg type: ${msg.type} in channel: ${channelName}`);
                }
            });

            port.onDisconnect.addListener((port) => {
                console.log(portName, "disconnected");
                channel.ports.delete(port.name);
                if (channel.dcdListener) {
                    channel.dcdListener(port);
                } else {
                    console.warn(`No disconnect listener for channel: ${channelName}`);
                }
            });
        });
    }

    //TODO: add Global Listener so that all ports can listen to a message

    addChannel(channelName: string) {
        let c: MChannel = {
            ports: new Map(),
            msgListeners: new Map(),
            cntListener: null,
            dcdListener: null,
        };
        this.#channels.set(channelName, c);
    }


    getPort(portName: string, success: PortListener, f: Failure): void {
        const channelName = portName.substring(0, 2);
        const c = this.#channels.get(channelName);
        if (!c) {
            f(new Error(`No channel with name: ${channelName}`));
            return;
        }
        const p = c.ports.get(portName);
        if (!p) {
            f(new Error(`No port with name: ${portName}`));
            return;
        }
        success(p.port);
    }

    getChannel(channelName: string): MChannel | undefined {
        return this.#channels.get(channelName);
    }

    setMsgListener(channelName: string, msgType: string, listener: MsgListener, f: Failure) {
        const c = this.#channels.get(channelName);
        if (c) {
            c.msgListeners.set(msgType, listener);
        } else {
            f(new Error(`No channel with name: ${channelName}`));
        }
    }

    setDcdListener(channelName: string, listener: PortListener, f: Failure) {
        const c = this.#channels.get(channelName);
        if (c) {
            c.dcdListener = listener;
        } else {
            f(new Error(`No channel with name: ${channelName}`));
        }
    }

    setCntListener(channelName: string, listener: PortListener, f: Failure) {
        const c = this.#channels.get(channelName);
        if (c) {
            c.cntListener = listener;
        } else {
            f(new Error(`No channel with name: ${channelName}`));
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

    onMessage(msgType: string, listener: MsgListener) {
        this.#msgListener.setMsgListener(this.#channelName, msgType, listener, (err) => {
            console.error(err);
        });
    }

    send(portName: string, msg: Message) {
        this.#msgListener.getPort(portName, (port) => {
            port.postMessage(msg);
        }, (err) => {
            console.error(err);
        });
    }

    sendAll(msg: Message) {
        const c = this.#msgListener.getChannel(this.#channelName);
        if (!c) {
            console.error(`No channel with name: ${this.#channelName}`);
            return;
        }
        c.ports.forEach((p) => {
            p.port.postMessage(msg);
        });
    }

    onDisconnect(listener: PortListener) {
        this.#msgListener.setDcdListener(this.#channelName, listener, (err) => {
            console.error(err);
        });
    }

    onConnect(listener: PortListener) {
        this.#msgListener.setCntListener(this.#channelName, listener, (err) => {
            console.error(err);
        });
    }
}

export { MessageListener, Channel };
