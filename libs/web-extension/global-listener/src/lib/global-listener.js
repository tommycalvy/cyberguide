import browser from 'webextension-polyfill';
import { BaseError } from '@cyberguide/shared/error-handling'; 

//interface Port {
//    name: PortName;
//    port: browser.Runtime.Port;
//    channelName: ChannelName;
//    tabId: TabId;
//}
//
//type ConnectListener = (port: Port) => void;
//type DisconnectListener = (port: Port) => void;
//type MessageListener = (message: Message, port: Port) => void;

/** Class that listens and provides utilities for communication between
*   background scripts, content scripts, popup scripts, and the sidebar.
*/
export default class GlobalListener {

    //private _allowedChannels: Set<ChannelName>;
    //
    //private connectListener: ConnectListener;
    //private messageListeners: Map<MessageType, MessageListener>;
    //private disconnectListener: DisconnectListener;

    //private ports: Map<PortName, Port>;
    //private channel_ports: Map<ChannelName, Set<Port>>;
    //private tab_ports: Map<TabId, Set<Port>>;

    /**
        * @param allowedChannels - An array of channel names that the 
        * listener will accept.
    */
    constructor(allowedChannels = ['sb', 'gb']) {

        this._allowedChannels = new Set(allowedChannels);

        this.connectListener = () => {};
        this.messageListeners = new Map();
        this.disconnectListener = () => {};

        this.ports = new Map();
        this.channel_ports = new Map();
        this.tab_ports = new Map();

        this.startListening((err) => {
            console.warn(err.message);
            console.warn(err.context);
        });
    }

    /**
    * @param {(err: BaseError) => void} errorCallback 
    * A function that's called if an error occurs while setting up the listener.
    * @returns void
    * @private
    */
    startListening(errorCallback) {
        browser.runtime.onConnect.addListener((port) => {

            const channelName = port.name.split('-')[0];
            if (!this.allowedChannels.has(channelName)) {
                const err = new BaseError('Invalid channel', { 
                    context: { channelName } 
                });
                return errorCallback(err);
            }

            const tabIdResult = this.getTabId(port);
            if (!tabIdResult.success) {
                const err = new BaseError('GlobalListener.getTabId failed', {
                    cause: tabIdResult.error 
                });
                return errorCallback(err);
            }
            const tabId = tabIdResult.result;

            const portName = channelName + '-' + tabId;
            const newPort = { name: portName, port, channelName, tabId };

            this.ports.set(portName, newPort);

            const channel = this.channel_ports.get(channelName); 
            if (!channel) {
                this.channel_ports.set(channelName, new Set());
            } else {
                channel.add(newPort);
            }

            const tab = this.tab_ports.get(tabId);
            if (!tab) {
                this.tab_ports.set(tabId, new Set([newPort]));
            } else {
                tab.add(newPort);
            }

            this.connectListener(newPort);

            port.onMessage.addListener((msg) => {
                const messageListener = this.messageListeners.get(msg.type);
                if (messageListener) {
                    messageListener(msg, newPort);
                } else {
                    const err = new BaseError('No listener for message type', {
                        context: { messageType: msg.type }
                    });
                    errorCallback(err);
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

    /**
        * @param {browser.Runtime.Port} port
        * @returns {import('@cyberguide/types/shared').Result<string>}
        * @private
    */
    getTabId(port) {
        let tabId = port.sender?.tab?.id?.toString();
        if (tabId) {
            return { success: true, result: tabId };
        } 
        tabId = port.name.split('-')[1];
        if (tabId) {
            return { success: true, result: tabId };
        }
        const err = new BaseError('No tabId in port.sender or port.name', {
            context: { portName: port.name }
        });
        return { success: false, error: err };
    }

    onConnect(listener: ConnectListener) {
        this.connectListener = listener;
    }

    onDisconnect(listener: DisconnectListener) {
        this.disconnectListener = listener;
    }

    onMessage(messageType: MessageType, listener: MessageListener) {
        this.messageListeners.set(messageType, listener);
    }

    sendToPort(portName: PortName, message: Message): Result<null> {
        const port = this.ports.get(portName);
        if (port) {
            port.port.postMessage(message);
            return { success: true, result: null };
        } else {
            const err = new BaseError('No port found', {
                context: { portName }
            });
            return { success: false, error: err };
        }
    }

    sendToChannel(
        channelName: ChannelName,
        message: Message,
        except?: TabId,
    ): Result<null> {
        const ports = this.channel_ports.get(channelName);
        if (ports) {
            ports.forEach((port) => {
                if (port.tabId !== except) {
                    port.port.postMessage(message);
                }
            });
            return { success: true, result: null };
        } else {
            const err = new BaseError('No channel found', {
                context: { channelName }
            });
            return { success: false, error: err };
        }
    }

    sendToTab(
        tabId: TabId,
        message: Message,
        except?: ChannelName
    ): Result<null> {
        const ports = this.tab_ports.get(tabId);
        if (ports) {
            ports.forEach((port) => {
                if (port.channelName !== except) {
                    port.port.postMessage(message);
                }
            });
            return { success: true, result: null };
        } else {
            const err = new BaseError('No tab found', {
                context: { tabId }
            });
            return { success: false, error: err };
        }
    }

    sendToAll(message: Message, except?: PortName): Result<null> {
        this.ports.forEach((port) => {
            if (port.name !== except) {
                port.port.postMessage(message);
            }
        });
        return { success: true, result: null };
    }

    get allowedChannels() {
        return this._allowedChannels;
    }
}
