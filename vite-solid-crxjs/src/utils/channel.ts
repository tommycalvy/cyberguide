import browser from "webextension-polyfill";
import type {
    Message,
    ChannelName,
    MessagingChannel,
    MessagingPort,
    PortListener,
    MessageListener,
    Failure,
} from "../types/messaging";


/** Class that creates a runtime.onConnect listener and returns the ports */
export class ChannelListener {
    #channels: Map<ChannelName, MessagingChannel>;

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
            const messagingPort: MessagingPort = {
                port: port,
                name: portName,
            };
            channel.ports.set(portName, messagingPort);
            const connectListener = channel.connectListener;
            if (connectListener) {
                connectListener(port);
            } else {
                console.warn(`No connectListener for channel: ${channelName}`);
            }

            port.onMessage.addListener((msg, port) => {
                if (!msg.type) {
                    console.warn(`No msg type from port: ${port.name}`);
                    return;
                }
                console.log(channelName, ": ", msg.type);
                const messageListener = channel.messageListeners.get(msg.type);
                if (messageListener) {
                    messageListener(port, msg);
                } else {
                    console.warn(`No listener for msg type: ${msg.type} in channel: ${channelName}`);
                }
            });

            port.onDisconnect.addListener((port) => {
                console.log(portName, "disconnected");
                channel.ports.delete(port.name);
                const disconnectListener = channel.disconnectListener;
                if (disconnectListener) {
                    disconnectListener(port);
                } else {
                    console.warn(`No disconnect listener for channel: ${channelName}`);
                }
            });
        });
    }

    //TODO: add Global Listener so that all ports can listen to a message

    addChannel(channelName: string) {
        let channel: MessagingChannel = {
            ports: new Map(),
            messageListeners: new Map(),
            connectListener: null,
            disconnectListener: null,
        };
        this.#channels.set(channelName, channel);
    }


    getPort(portName: string, success: PortListener, f: Failure): void {
        const channelName = portName.substring(0, 2);
        const channel = this.#channels.get(channelName);
        if (!channel) {
            f(new Error(`No channel with name: ${channelName}`));
            return;
        }
        const p = channel.ports.get(portName);
        if (!p) {
            f(new Error(`No port with name: ${portName}`));
            return;
        }
        success(p.port);
    }

    getChannel(channelName: string): MessagingChannel | undefined {
        return this.#channels.get(channelName);
    }

    setMessageListener(
        channelName: string,
        messageType: string,
        messageListener: MessageListener,
        f: Failure
    ) {
        const channel = this.#channels.get(channelName);
        if (channel) {
            channel.messageListeners.set(messageType, messageListener);
        } else {
            f(new Error(`No channel with name: ${channelName}`));
        }
    }

    setDisconnectListener(
        channelName: string,
        disconnectListener: PortListener,
        f: Failure
    ) {
        const channel = this.#channels.get(channelName);
        if (channel) {
            channel.disconnectListener = disconnectListener;
        } else {
            f(new Error(`No channel with name: ${channelName}`));
        }
    }

    setConnectListener(
        channelName: string,
        connectListener: PortListener,
        f: Failure
    ) {
        const channel = this.#channels.get(channelName);
        if (channel) {
            channel.connectListener = connectListener;
        } else {
            f(new Error(`No channel with name: ${channelName}`));
        }
    }
}

export class Channel {

    #channelName: string;
    #channelListener: ChannelListener;

    constructor(channelName: string, channelListener: ChannelListener) {
        this.#channelName = channelName;
        this.#channelListener = channelListener;
        this.#channelListener.addChannel(this.#channelName);
    }


    send(portName: string, msg: Message) {
        this.#channelListener.getPort(portName, (port) => {
            port.postMessage(msg);
        }, (err) => {
            console.error(err);
        });
    }

    sendToAll(msg: Message, exceptPortName: string = "") {
        const channel = this.#channelListener.getChannel(this.#channelName);
        if (!channel) {
            console.error(`No channel with name: ${this.#channelName}`);
            return;
        }
        channel.ports.forEach((p) => {
            if (p.name === exceptPortName) {
                return;
            }
            p.port.postMessage(msg);
        });
    }

    onMessage(messageType: string, messageListener: MessageListener) {
        this.#channelListener.setMessageListener(
            this.#channelName,
            messageType,
            messageListener,
            (err) => {
                console.error(err);
            }
        );
    }

    onDisconnect(disconnectListener: PortListener) {
        this.#channelListener.setDisconnectListener(
            this.#channelName,
            disconnectListener,
            (err) => {
                console.error(err);
            }
        );
    }

    onConnect(connectListener: PortListener) {
        this.#channelListener.setConnectListener(
            this.#channelName,
            connectListener, 
            (err) => {
                console.error(err);
            }
        );
    }
}
