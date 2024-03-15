import browser from 'webextension-polyfill';
import type { Message, MessageType } from '../types/messaging';
import { 
    errorHandler,
    BaseError,
    type Result,
} from "./error";

type TabId = number;
type ChannelName = string;
type PortName = string;

interface Port {
    port: browser.Runtime.Port;
    tabId: TabId;
    channelName: ChannelName;
}

type ConnectListener = (port: Port) => void;
type DisconnectListener = (port: Port) => void;
type MessageListener = (port: Port, msg: Message) => void;

export default class GlobalListener {

    private allowedChannels: Set<ChannelName>;
    
    private connectListener: ConnectListener;
    private messageListeners: Map<MessageType, MessageListener>;
    private disconnectListener: DisconnectListener;

    private ports: Map<PortName, Port>;
    private channel_ports: Map<ChannelName, Set<Port>>;
    private tab_ports: Map<TabId, Set<Port>>;

    constructor(allowedChannels: ChannelName[] = ['sb', 'gb']) {

        this.allowedChannels = new Set(allowedChannels);

        this.connectListener = () => {};
        this.messageListeners = new Map();
        this.disconnectListener = () => {};

        this.ports = new Map();
        this.channel_ports = new Map();
        this.tab_ports = new Map();

        this.startListening((err) => {
            throw errorHandler('GlobalListener.startListening', err);
        });
    }

    private startListening(onError: (err: BaseError) => void) {
        browser.runtime.onConnect.addListener((port) => {

            const channelName = port.name.split('-')[0];
            if (!this.allowedChannels.has(channelName)) {
                const err = new BaseError('Invalid channel', { 
                    context: { channelName } 
                });
                return onError(err);
            }

            const tabIdResult = this.getTabId(port);
            if (!tabIdResult.success) {
                const err = new Error('GlobalListener.getTabId failed', {
                    cause: tabIdResult.error 
                });
                return onError(err);
            }
            const tabId = tabIdResult.result;

            const portName = channelName + '-' + tabId;
            const newPort = { port, channelName, tabId };

            this.ports.set(portName, newPort);

            const channel = this.channel_ports.get(channelName); 
            if (!channel) {
                this.channel_ports.set(channelName, new Set());
            } else {
                channel.add(newPort);
            }

            const tab = this.tab_ports.get(tabId);
            if (!tab) {
                this.tab_ports.set(tabId, new Set());
            } else {
                tab.add(newPort);
            }

            this.connectListener(newPort);

            port.onMessage.addListener((msg) => {
                const messageListener = this.messageListeners.get(msg.type);
                if (messageListener) {
                    messageListener(newPort, msg);
                } else {
                    onError(new BaseError(
                        'No listener for message type',
                        { context: { messageType: msg.type } }
                    ));
                }
            });

            port.onDisconnect.addListener(() => {
                this.ports.delete(portName);
                this.channel_ports.get(channelName)?.delete(newPort);
                this.tab_ports.get(tabId)?.delete(newPort);
                this.disconnectListener(newPort);
            });
        });
    }

    public onConnect(listener: ConnectListener) {
        this.connectListener = listener;
    }

    public onDisconnect(listener: DisconnectListener) {
        this.disconnectListener = listener;
    }

    public onMessage(messageType: MessageType, listener: MessageListener) {
        this.messageListeners.set(messageType, listener);
    }

    private getTabId(port: browser.Runtime.Port): Result<TabId> {
        let tabId = port.sender?.tab?.id;
        if (tabId) {
            return { success: true, result: tabId };
        } 
        tabId = parseInt(port.name.split('-')[1]);
        if (tabId) {
            return { success: true, result: tabId };
        }
        const err = new BaseError('No tabId in port.sender or port.name', {
            context: { portName: port.name }
        });
        return { success: false, error: err };
    }

    public sendToPort(
        channelName: ChannelName,
        tabId: TabId,
        message: Message,
    ): Result<null> {
        const portName = channelName + '-' + tabId;
        const port = this.ports.get(portName);
        if (port) {
            port.port.postMessage(message);
            return { success: true, result: null };
        } else {
            const err = new BaseError('No port found', {
                context: { channelName, tabId }
            });
            return { success: false, error: err };
        }
    }

    public sendToChannel(
        channelName: ChannelName,
        message: Message,
    ): Result<null> {
        const channel = this.channel_ports.get(channelName);
        if (channel) {
            for (const port of channel) {
                port.port.postMessage(message);
            }
            return { success: true, result: null };
        } else {
            const err = new BaseError('No channel found', {
                context: { channelName }
            });
            return { success: false, error: err };
        }
    }

    public sendToTab( tabId: TabId, message: Message): Result<null> {
        const tab = this.tab_ports.get(tabId);
        if (tab) {
            for (const port of tab) {
                port.port.postMessage(message);
            }
            return { success: true, result: null };
        } else {
            const err = new BaseError('No tab found', {
                context: { tabId }
            });
            return { success: false, error: err };
        }
    }
}
