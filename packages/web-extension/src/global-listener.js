import { BaseError } from '@cyberguide/shared';

/** Class that listens and provides utilities for communication between
*   background scripts, content scripts, popup scripts, and the sidebar.
*/
export class GlobalListener {

    /** @typedef {string} PortName */
    /** @typedef {string} ChannelName */
    /** @typedef {string} TabId */

    /**
        * @param {string[]} [allowedChannels] - Array of allowed channel names 
    */
    constructor(allowedChannels = ['sb', 'gb']) {

        /** @type {Set<ChannelName>} */
        this._allowedChannels = new Set(allowedChannels);

        /** @type {((port: import('./types').Port) => void)|null} */
        this._connectListener = null;

        /** @type {((port: import('./types').Port) => void)|null} */
        this._disconnectListener = null;

        /** @type {Map<string, import('./types').MessageListener>} */
        this._messageListeners = new Map();

        /** @type {Map<PortName, import('./types').Port>} */
        this._ports = new Map();

        /** @type {Map<ChannelName, Set<import('./types').Port>>} */
        this._channel_ports = new Map();

        /** @type {Map<TabId, Set<import('./types').Port>>} */
        this._tab_ports = new Map();
    }

    /**
    * @param {import('./types').OnConnect} onConnect
    * @param {(err: BaseError) => void} errorCallback 
    * A function that's called if an error occurs while setting up the listener
    * @returns void
    */
    startListening(onConnect, errorCallback) {
        onConnect.addListener((runtimePort) => {

            /** @type {ChannelName} */
            const channelName = runtimePort.name.split('-')[0];
            if (!this._allowedChannels.has(channelName)) {
                const err = new BaseError('Invalid channel', { 
                    context: { channelName } 
                });
                return errorCallback(err);
            }

            /** @type {TabId | undefined} */ 
            let tabId = runtimePort.sender?.tab?.id?.toString();
            if (!tabId) {
                tabId = runtimePort.name.split('-')[1];
            }
            if (!tabId) {
                const err = new BaseError(
                    'No tabId in port.sender or port.name',
                    { context: { portName: runtimePort.name }
                });
                return errorCallback(err);
            }

            /** @type {PortName} */
            const portName = channelName + '-' + tabId;

            /** @type {import('./types').Port} */
            const newPort = { 
                name: portName,
                runtimePort,
                channelName,
                tabId 
            };

            // Add the new port so you can search by portName
            this._ports.set(portName, newPort);

            // Add the new port so you can get list of ports by channelName
            const channel = this._channel_ports.get(channelName); 
            if (!channel) {
                this._channel_ports.set(channelName, new Set());
            } else {
                channel.add(newPort);
            }

            // Add the new port so you can get list of ports by tabId
            const tab = this._tab_ports.get(tabId);
            if (!tab) {
                this._tab_ports.set(tabId, new Set([newPort]));
            } else {
                tab.add(newPort);
            }

            // Call the connect listener
            if (this._connectListener) {
                this._connectListener(newPort);
            } else {
                const err = new BaseError('No connect listener');
                errorCallback(err);
            }

            // Call the message listener for its message type
            runtimePort.onMessage.addListener((msg) => {
                const messageListener = this._messageListeners.get(msg.type);
                if (messageListener) {
                    messageListener(msg, newPort);
                } else {
                    const err = new BaseError('No listener for message type', {
                        context: { messageType: msg.type }
                    });
                    errorCallback(err);
                }
            });

            runtimePort.onDisconnect.addListener(() => {
                this._ports.delete(newPort.name);
                this._channel_ports.get(newPort.channelName)?.delete(newPort);
                this._tab_ports.get(newPort.tabId)?.delete(newPort);
                if (this._disconnectListener) {
                    this._disconnectListener(newPort);
                } else {
                    const err = new BaseError('No disconnect listener');
                    errorCallback(err);
                }
            });
        });
    }

    /**
        * @param {(port: import('./types').Port) => void} connectListener
        * @returns void
    */
    onConnect(connectListener) {
        this._connectListener = connectListener;
    }

    /**
        * @param {(port: import('./types').Port) => void} disconnectListener
        * @returns void
    */
    onDisconnect(disconnectListener) {
        this._disconnectListener = disconnectListener;
    }

    /**
        * @param {string} messageType
        * @param {import('./types').MessageListener} messageListener
        * @returns void
    */
    onMessage(messageType, messageListener) {
        this._messageListeners.set(messageType, messageListener);
    }

    /**
        * @param {string} portName
        * @param {import('./types').Message} message
        * @returns {import('@cyberguide/shared/types').Result<null>}
    */
    sendToPort(portName, message) {
        const port = this._ports.get(portName);
        if (port) {
            port.runtimePort.postMessage(message);
            return { success: true, result: null };
        } else {
            const err = new BaseError('No port found', {
                context: { portName }
            });
            return { success: false, error: err };
        }
    }

    /**
        * @param {string} channelName
        * @param {import('./types').Message} message
        * @param {string} [except]
        * @returns {import('@cyberguide/shared/types').Result<null>}
    */
    sendToChannel(channelName, message, except) {
        const ports = this._channel_ports.get(channelName);
        if (ports) {
            ports.forEach((port) => {
                if (port.tabId !== except) {
                    port.runtimePort.postMessage(message);
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

    /**
        * @param {string} tabId
        * @param {import('./types').Message} message
        * @param {string} [except]
        * @returns {import('@cyberguide/shared/types').Result<null>}
    */
    sendToTab(tabId, message, except) {
        const ports = this._tab_ports.get(tabId);
        if (ports) {
            ports.forEach((port) => {
                if (port.channelName !== except) {
                    port.runtimePort.postMessage(message);
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

    /**
        * @param {import('./types').Message} message
        * @param {string} [except]
        * @returns {import('@cyberguide/shared/types').Result<null>}
    */
    sendToAll(message, except) {
        this._ports.forEach((port) => {
            if (port.name !== except) {
                port.runtimePort.postMessage(message);
            }
        });
        return { success: true, result: null };
    }
}
