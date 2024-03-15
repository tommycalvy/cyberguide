import browser from "webextension-polyfill";
import type {
    Message,
    ChannelName,
    PortListener,
    MessageListener,
    TabId,
    MessageType,
} from "../types/messaging";
import { 
    errorHandler,
    BaseError,
    type Result,
} from "./error";

interface Port {
    port: browser.Runtime.Port;
    tabId: TabId;
}

interface PortDescriptor {
    channelName: ChannelName;
    tabId: TabId;
};

interface MessagingChannel {
    name: ChannelName;
    ports: Map<TabId, Port>;
    messageListeners: Map<ChannelName, MessageListener>;
    disconnectListener: PortListener | null;
    connectListener: PortListener | null;
}

type GlobalConnectListener = (
    port: browser.Runtime.Port,
    tabId: TabId,
    channelName: ChannelName,
) => void;


type GlobalMessageListener = (
    port: browser.Runtime.Port,
    msg: Message,
    tabId: TabId,
    channelName: ChannelName,
) => void;

/** Class that creates a runtime.onConnect listener and returns the ports */
export class GlobalListener {

    private channels: Map<ChannelName, Channel>; 

    private globalConnectListener: GlobalConnectListener | null;

    private globalMessageListeners: Map<MessageType, GlobalMessageListener>;

    private allowedChannels: string[];

    constructor() {
        this.channels = new Map();
        this.globalConnectListener = null;
        this.globalMessageListeners = new Map();
        this.allowedChannels = ["sb", "gb"];
        this.startListening((err) => {
            throw errorHandler("ChannelListener.startListening", err)
        });
    }

    private startListening(onError: (err: Error) => void) {
        browser.runtime.onConnect.addListener((port) => {
            const channel = this.getChannelOnConnect(port.name);
            if (!channel.success) {
                port.disconnect();
                return onError(errorHandler(
                    "ChannelListener.getChannelOnConnect", 
                    channel.error,
                ));
            }

            const tabId = this.getTabId(port);
            if (!tabId.success) {
                port.disconnect();
                return onError(
                    errorHandler("ChannelListener.getTabId", tabId.error)
                );
            }

            const addPort = this.addPortToChannel(
                port,
                channel.result,
                tabId.result
            );
            if (!addPort.success) {
                port.disconnect();
                return onError(errorHandler(
                    "ChannelListener.addPortToChannel", 
                    addPort.error,
                ));
            }

            const onConnect = this.onConnectListener(
                port,
                channel.result,
                tabId.result
            );
            if (!onConnect.success) {
                port.disconnect();
                return onError(errorHandler(
                    "ChannelListener.onConnectListener",
                    onConnect.error,
                ));
            }

            this.onMessageListener(
                port,
                channel.result,
                tabId.result,
                (err) => {
                    port.disconnect();
                    onError(
                        errorHandler("ChannelListener.onMessageListener", err)
                    );
                }
            );

            this.onDisconnectListener(
                port,
                channel.result,
                tabId.result,
                (err) => {
                    port.disconnect();
                    onError(errorHandler(
                        "ChannelListener.onDisconnectListener",
                        err
                    ));
                }
            );
        });
    }

    private addPortToChannel(
        port: browser.Runtime.Port,
        channel: MessagingChannel,
        tabId: TabId,
    ): Result<null> {
        const messagingPort = channel.ports.get(tabId);
        if (messagingPort) {
            return { success: false, error: new BaseError(
                'Port already exists',
                { context: { tabId, channelName: channel.name } }
            )};
        }
        channel.ports.set(tabId, {
            tabId,
            port: port,
        });
        return { success: true, result: null };
    }

    private getTabId(port: browser.Runtime.Port): Result<TabId> {
        let tabId = port.sender?.tab?.id;
        if (tabId) {
            return { success: true, result: tabId };
        }
        console.log('No tabId in port. Must be sidebar');
        const tabIdString = port.name.split('-')[1];
        tabId = parseInt(tabIdString);
        if (tabId) {
            return { success: true, result: tabId };
        }
        return { success: false, error: new BaseError(
            'No tabId in port or portName',
            { context: { portName: port.name } }
        )};
    }

    private getChannelOnConnect(
        portName: string,
    ): Result<MessagingChannel> {
        const channelName = portName.substring(0, 2);
        if (!this.allowedChannels.includes(channelName)) {
            return { success: false, error: new BaseError(
                'Channel is not allowed',
                { context: { channelName } }
            )};
        }
        console.log(portName, "connected");
        const channel = this.channels.get(channelName);
        if (channel) {
            return { success: true, result: channel };
        }
        return { success: false, error: new BaseError(
            'No listeners for channel',
            { context: { channelName } }
        )};
    }

    private onConnectListener(
        port: browser.Runtime.Port,
        channel: MessagingChannel,
        tabId: TabId,
    ): Result<null> {
        let hasListener = false;
        const connectListener = channel.connectListener;
        if (connectListener) {
            hasListener = true;
            connectListener(port, tabId);
            return { success: true, result: null };
        }
        if (this.globalConnectListener) {
            hasListener = true;
            this.globalConnectListener(port, tabId, channel.name);
            return { success: true, result: null };
        }
        if (!hasListener) {
            return { success: false, error: new BaseError(
                'No connectListener for channel',
                { context: { channelName: channel.name } }
            )};
        }
        return { success: true, result: null };
    }

    private onMessageListener(
        port: browser.Runtime.Port,
        channel: MessagingChannel,
        tabId: number,
        onError: (err: Error) => void,
    ) {
        port.onMessage.addListener((msg, port) => {
            if (!msg.type) {
                return onError(
                    new Error(`No msg type from port: ${port.name}`)
                );
            }
            console.log(channel.name, ": ", msg.type);
            let hasListener = false;
            const messageListener = channel.messageListeners.get(msg.type);
            if (messageListener) {
                hasListener = true;
                messageListener(port, msg, tabId);
            }
            const globalListener = this.globalMessageListeners.get(msg.type);
            if (globalListener) {
                hasListener = true;
                globalListener(port, msg, tabId, channel.name);
            }
            if (!hasListener) {
                return onError(
                    new Error(`No listener for msg type: ${msg.type}`)
                );
            }
        });
    }

    private onDisconnectListener(
        port: browser.Runtime.Port,
        channel: MessagingChannel,
        tabId: number,
        onError: (err: Error) => void,
    ) {
        port.onDisconnect.addListener((port) => {
            console.log(port.name, "disconnected");
            channel.ports.delete(tabId);
            const disconnectListener = channel.disconnectListener;
            if (disconnectListener) {
                return disconnectListener(port, tabId);
            }
            return onError(
                new Error(`No disconnectListener for channel: ${channel.name}`)
            );
        });
    }


    private addChannel(channelName: string) {
        this.channels.set(channelName, {
            name: channelName,
            ports: new Map(),
            messageListeners: new Map(),
            connectListener: null,
            disconnectListener: null,
        });
    }


    private getPort(channelName: string, tabId: number)
    : Result<browser.Runtime.Port> {
        const channel = this.channels.get(channelName);
        if (!channel) {
            return { success: false, error: new BaseError(
                'No channel exists with that name',
                { context: { channelName } }
            )};
        }
        const messagingPort = channel.ports.get(tabId);
        if (!messagingPort) {
            return { success: false, error: new BaseError(
                'No port exists in that channel with that tabId',
                { context: { tabId, channelName } }
            )};
        }
        return { success: true, result: messagingPort.port };
    }

    private getChannel(channelName: string): Result<MessagingChannel> {
        const channel = this.channels.get(channelName);
        if (!channel) {
            return { success: false, error: new BaseError(
                'No channel exists with that name',
                { context: { channelName} }
            )};
        }
        return { success: true, result: channel };
    }

    private setChannelConnectListener(
        channelName: string,
        connectListener: PortListener,
    ): Result<null> {
        const channel = this.channels.get(channelName);
        if (!channel) {
            return { success: false, error: new BaseError(
                'No channel exists with that name',
                { context: { channelName } }
            )};
        }
        channel.connectListener = connectListener;
        return { success: true, result: null };
    }

    private setChannelMessageListener(
        channelName: string,
        messageType: MessageType,
        messageListener: MessageListener,
    ): Result<null> {
        const channel = this.channels.get(channelName);
        if (!channel) {
            return { success: false, error: new BaseError(
                'No channel exists with that name',
                { context: { channelName } }
            )};
        }
        channel.messageListeners.set(messageType, messageListener);
        return { success: true, result: null };
    }

    private setChannelDisconnectListener(
        channelName: string,
        disconnectListener: PortListener,
    ): Result<null> {
        const channel = this.channels.get(channelName);
        if (!channel) {
            return { success: false, error: new BaseError(
                'No channel exists with that name',
                { context: { channelName } }
            )};
        }
        channel.disconnectListener = disconnectListener;
        return { success: true, result: null };
    }

    public sendToTab(
        tabId: number,
        msg: Message,
        exceptChannel?: ChannelName,
    ): Result<null> {
        this.channels.forEach((channel) => {
            if (channel.name !== exceptChannel) {
                const messagingPort = channel.ports.get(tabId);
                if (messagingPort) {
                    messagingPort.port.postMessage(msg);
                } else {
                    return { success: false, error: new BaseError(
                        'No port with that channelName and tabId',
                        { context: { tabId, channelName: channel.name } }
                    )};
                }
            }
        });
        return { success: true, result: null };
    }

    static Channel = class Channel {

        private channelName: string;
        private globalListener: GlobalListener;

        ports: Map<TabId, browser.Runtime.Port>;
        messageListeners: Map<MessageType, MessageListener>;
        disconnectListener: PortListener | null;
        connectListener: PortListener | null;

        constructor(channelName: ChannelName, globalListener: GlobalListener) {
            this.channelName = channelName;
            this.globalListener = globalListener;

            this.ports = new Map();
            this.messageListeners = new Map();
            this.connectListener = null;
            this.disconnectListener = null;
            this.globalListener.addChannel(this.channelName);
        }

        send(tabId: TabId, msg: Message): Result<null> {
            const port = this.globalListener.getPort(
                this.channelName, tabId
            );
            if (!port.success) {
                return { success: false, error: new Error(
                    'channel.send failed',
                    { cause: port.error }
                )};
            }
            port.result.postMessage(msg);
            return { success: true, result: null };
        }

        sendToAll(msg: Message, exceptTabId?: number): Result<null> {
            const channel = this.channelListener.getChannel(this.channelName);
            if (!channel.success) {
                return { success: false, error: new Error(
                    'channel.sendToAll failed', 
                    { cause: channel.error }
                )};
            }
            channel.result.ports.forEach((messagingPort) => {
                if (messagingPort.tabId !== exceptTabId) {
                    messagingPort.port.postMessage(msg);
                }
            });
            return { success: true, result: null };
        }

        sendGlobal(msg: Message, exceptPort?: PortDescriptor) {
            this.channelListener.sendToAll(msg, exceptPort);
        }

        sendToTab(tabId: TabId, msg: Message): Result<null> {
            const result = this.channelListener.sendToTab(
                tabId, 
                msg,
                this.channelName
            );
            if (!result.success) {
                return { success: false, error: new Error(
                    'channel.sendToTab failed',
                    { cause: result.error }
                )};
            }
            return { success: true, result: null };
        }

        onConnect(connectListener: PortListener): Result<null> {
            const result = this.channelListener.setChannelConnectListener(
                this.channelName,
                connectListener, 
            );
            if (!result.success) {
                return { success: false, error: new Error(
                    'channel.onConnect failed',
                    { cause: result.error }
                )};
            }
            return { success: true, result: null };
        }

        onMessage(messageType: MessageType, messageListener: MessageListener)
        : Result<null> {
            const result = this.channelListener.setChannelMessageListener(
                this.channelName,
                messageType,
                messageListener,
            );
            if (!result.success) {
                return { success: false, error: new Error(
                    'channel.onMessage failed',
                    { cause: result.error }
                )};
            }
            return { success: true, result: null };
        }

        onDisconnect(disconnectListener: PortListener): Result<null> {
            const result = this.channelListener.setChannelDisconnectListener(
                this.channelName,
                disconnectListener,
            );
            if (!result.success) {
                return { success: false, error: new Error(
                    'channel.onDisconnect failed',
                    { cause: result.error }
                )};
            }
            return { success: true, result: null };
        }
    }

    public createChannel(channelName: string) {
        return new this.Channel(channelName, this);
    }

    public onConnect(globalConnectListener: GlobalConnectListener) {
        this.globalConnectListener = globalConnectListener;
    }


    public onMessage(
        messageType: MessageType,
        globalMessageListener: GlobalMessageListener,
    ) {
        this.globalMessageListeners.set(messageType, globalMessageListener);
    }

    public sendToAll(
        msg: Message,
        exceptPort?: PortDescriptor,
    ) {
        this.channels.forEach((channel) => {
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
}

