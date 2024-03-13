import browser from "webextension-polyfill";
import type {
    Message,
    ChannelName,
    MessagingChannel,
    PortListener,
    MessageListener,
    TabId,
    MessageType,
    PortDescriptor,
    GlobalListener,
} from "../types/messaging";


/** Class that creates a runtime.onConnect listener and returns the ports */
export class ChannelListener {
    #channels: Map<ChannelName, MessagingChannel>;
    #globalListeners: Map<MessageType, GlobalListener>;
    allowedChannels: string[];

    constructor() {
        this.#channels = new Map();
        this.#globalListeners = new Map();
        this.allowedChannels = ["sb", "gb"];
        this.startListening();
    }

    startListening() {
        browser.runtime.onConnect.addListener((port) => {
            const channel = this.getChannelOnConnect(port.name);
            if (channel instanceof Error) {
                port.disconnect();
                throw new Error('channelListener.getChannelOnConnect failed', {
                    cause: channel,
                });
            }

            const tabId = this.getTabId(port);
            if (tabId instanceof Error) {
                port.disconnect();
                throw new Error('channelListener.getTabId failed', {
                    cause: tabId,
                });
            }

            const addPortErr = this.addPortToChannel(channel, port, tabId);
            if (addPortErr) {
                port.disconnect();
                throw new Error('channelListener.addPortToChannel failed', {
                    cause: addPortErr,
                });
            }

            const onConnectErr = this.onConnectListener(port, channel, tabId);
            if (onConnectErr) {
                port.disconnect();
                throw new Error('channelListener.onConnectListener failed', { 
                    cause: onConnectErr 
                });
            }

            this.onMessageListener(port, channel, tabId);
            this.onDisconnectListener(port, channel, tabId);

        });
    }

    addPortToChannel(
        channel: MessagingChannel,
        port: browser.Runtime.Port,
        tabId: TabId,
    ): Error | null {
        const messagingPort = channel.ports.get(tabId);
        if (messagingPort) {
            return new Error(`Port ${channel.name}-${tabId} already exists`);
        }
        channel.ports.set(tabId, {
            tabId,
            port: port,
        });
        return null;
    }

    getTabId(port: browser.Runtime.Port)
    : number | Error {
        let tabId = port.sender?.tab?.id;
        if (tabId) {
            return tabId;
        }
        console.log('No tabId in port. Must be sidebar');
        const tabIdString = port.name.split('-')[1];
        tabId = parseInt(tabIdString);
        if (tabId) {
            return tabId;
        }
        return new Error(`No tabId in port or portName: ${port.name}`);
    }

    getChannelOnConnect(
        portName: string,
    ): MessagingChannel | Error {
        const channelName = portName.substring(0, 2);
        if (!this.allowedChannels.includes(channelName)) {
            return new Error(`Channel: ${channelName} is not allowed`);
        }
        console.log(portName, "connected");
        const channel = this.#channels.get(channelName);
        if (channel) {
            return channel;
        }
        return new Error(`No listeners for channel: ${channelName}`);
    }

    onConnectListener(
        port: browser.Runtime.Port,
        channel: MessagingChannel,
        tabId: TabId,
    )
    : Error | null {
        const connectListener = channel.connectListener;
        if (connectListener) {
            connectListener(port, tabId);
            return null;
        }
        return new Error(`No connectListener for channel: ${channel.name}`);
    }

    onMessageListener(
        port: browser.Runtime.Port,
        channel: MessagingChannel,
        tabId: number,
    ) {
        port.onMessage.addListener((msg, port) => {
            if (!msg.type) {
                throw new Error(`No msg type from port: ${port.name}`);
            }
            console.log(channel.name, ": ", msg.type);
            let hasListener = false;
            const messageListener = channel.messageListeners.get(msg.type);
            if (messageListener) {
                hasListener = true;
                messageListener(port, msg, tabId);
            }
            const globalListener = this.#globalListeners.get(msg.type);
            if (globalListener) {
                hasListener = true;
                globalListener(port, msg, tabId, channel.name);
            }
            if (!hasListener) {
                throw new Error(`No listener for msg type: ${msg.type}`);
            }
        });
    }

    onDisconnectListener(
        port: browser.Runtime.Port,
        channel: MessagingChannel,
        tabId: number,
    ) {
        port.onDisconnect.addListener((port) => {
            console.log(port.name, "disconnected");
            channel.ports.delete(tabId);
            const disconnectListener = channel.disconnectListener;
            if (disconnectListener) {
                return disconnectListener(port, tabId);
            }
            throw new Error(`No disconnectLisnr for channel: ${channel.name}`);
        });
    }

    createChannel(channelName: string): Channel {
        return new Channel(channelName, this);
    }

    addChannel(channelName: string) {
        let channel: MessagingChannel = {
            name: channelName,
            ports: new Map(),
            messageListeners: new Map(),
            connectListener: null,
            disconnectListener: null,
        };
        this.#channels.set(channelName, channel);
    }

    setGlobalListener(
        messageType: MessageType,
        globalListener: GlobalListener,
    ) {
        this.#globalListeners.set(messageType, globalListener);
    }


    getPort(channelName: string, tabId: number)
    : browser.Runtime.Port | Error {
        const channel = this.#channels.get(channelName);
        if (!channel) {
            return new Error(`No channel with name: ${channelName}`);
        }
        const messagingPort = channel.ports.get(tabId);
        if (!messagingPort) {
            return new Error(`No port ${channelName}-${tabId}`);
        }
        return messagingPort.port;
    }

    getChannel(channelName: string): MessagingChannel | Error {
        const channel = this.#channels.get(channelName);
        if (!channel) {
            return new Error(`No channel with name: ${channelName}`);
        }
        return channel;
    }

    setMessageListener(
        channelName: string,
        messageType: MessageType,
        messageListener: MessageListener,
    ): Error | null {
        const channel = this.#channels.get(channelName);
        if (!channel) {
            return new Error(`No channel with name: ${channelName}`);
        }
        channel.messageListeners.set(messageType, messageListener);
        return null;
    }

    setDisconnectListener(
        channelName: string,
        disconnectListener: PortListener,
    ): Error | null {
        const channel = this.#channels.get(channelName);
        if (!channel) {
            return new Error(`No channel with name: ${channelName}`);
        }
        channel.disconnectListener = disconnectListener;
        return null;
    }

    setConnectListener(
        channelName: string,
        connectListener: PortListener,
    ) {
        const channel = this.#channels.get(channelName);
        if (!channel) {
            return new Error(`No channel with name: ${channelName}`);
        }
        channel.connectListener = connectListener;
        return null;
    }

    sendToAll(
        msg: Message,
        exceptPort?: PortDescriptor,
    ) {
        this.#channels.forEach((channel) => {
            channel.ports.forEach((messagingPort) => {
                if (
                    channel.name !== exceptPort?.channelName &&
                    messagingPort.tabId !== exceptPort?.tabId
                ) {
                    messagingPort.port.postMessage(msg);
                }
            });
        });
    }

    sendToTab(
        tabId: number,
        msg: Message,
        exceptChannel?: ChannelName,
    ): Error | null {
        this.#channels.forEach((channel) => {
            if (channel.name !== exceptChannel) {
                const messagingPort = channel.ports.get(tabId);
                if (messagingPort) {
                    messagingPort.port.postMessage(msg);
                } else {
                    return new Error(`No port ${channel.name}-${tabId}`);
                }
            }
        });
        return null;
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


    send(tabId: TabId, msg: Message): Error | null {
        const port = this.#channelListener.getPort(
            this.#channelName, tabId
        );
        if (port instanceof Error) {
            return new Error('channel.send failed', { cause: port });
        }
        port.postMessage(msg);
        return null;
    }

    sendToAll(msg: Message, exceptTabId?: number): Error | null {
        const channel = this.#channelListener.getChannel(this.#channelName);
        if (channel instanceof Error) {
            return new Error('channel.sendToAll failed', { cause: channel });
        }
        channel.ports.forEach((messagingPort) => {
            if (messagingPort.tabId !== exceptTabId) {
                messagingPort.port.postMessage(msg);
            }
        });
        return null;
    }

    sendGlobal(msg: Message, exceptPort?: PortDescriptor) {
        this.#channelListener.sendToAll(msg, exceptPort);
    }

    sendToTab(tabId: TabId, msg: Message) {
        const err = this.#channelListener.sendToTab(
            tabId, 
            msg,
            this.#channelName
        );
        if (err) {
            return new Error('channel.sendToTab failed', { cause: err });
        }
        return null;
    }



    onMessage(messageType: MessageType, messageListener: MessageListener)
    : Error | null {
        const err = this.#channelListener.setMessageListener(
            this.#channelName,
            messageType,
            messageListener,
        );
        if (err) {
            return new Error('channel.onMessage failed', { cause: err });
        }
        return null;
    }

    onDisconnect(disconnectListener: PortListener): Error | null {
        const err = this.#channelListener.setDisconnectListener(
            this.#channelName,
            disconnectListener,
        );
        if (err) {
            return new Error('channel.onDisconnect failed', { cause: err });
        }
        return null;
    }

    onConnect(connectListener: PortListener): Error | null {
        const err = this.#channelListener.setConnectListener(
            this.#channelName,
            connectListener, 
        );
        if (err) {
            return new Error('channel.onConnect failed', { cause: err });
        }
        return null;
    }
}
