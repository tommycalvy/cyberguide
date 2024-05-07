import { BaseError } from '@cyberguide/shared';

/** Class that listens and provides utilities for communication between
*   background scripts, content scripts, popup scripts, and the sidebar.
*/
export class GlobalListener {

    /** @typedef {string} PortName */
    /** @typedef {string} ChannelName */
    /** @typedef {string} TabId */

    /**
        * @param {Object} [options={}]
        * @param {string[]} [options.allowedChannels] 
        * @param {boolean} [options.logging] - Whether to log events
    */
    constructor({ allowedChannels = ['sb', 'gb'], logging = false } = {}) {

        /** @type {Set<ChannelName>} */
        this._allowedChannels = new Set(allowedChannels);

        /** @type {boolean} */
        this._logging = logging;

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

            if (this._logging) {
                console.log('New connection attempt...');
                if (!this._connectListener) {
                    console.warn(
                        'No connect listener. Call onConnect() first'
                    );
                }
                if (!this._disconnectListener) {
                    console.warn(
                        'No disconnect listener. Call onDisconnect() first'
                    );
                }
            }

            /** @type {ChannelName} */
            const channelName = runtimePort.name.split('-')[0];
            if (!this._allowedChannels.has(channelName)) {
                const err = new BaseError('Invalid channel', { 
                    context: { channelName } 
                });
                if (this._logging) console.error(err);
                return errorCallback(err);
            }

            /** @type {TabId | undefined} */ 
            let tabId = runtimePort.sender?.tab?.id?.toString();
            if (!tabId) {
                tabId = runtimePort.name.split('-')[1];
                if (tabId && isNaN(parseFloat(tabId))) {
                    const err = new BaseError(
                        'tabId is not a number',
                        { context: { tabId }
                    });
                    if (this._logging) console.error(err);
                    return errorCallback(err);
                }
            }
            if (!tabId) {
                const err = new BaseError(
                    'No tabId in port.sender or port.name',
                    { context: { portName: runtimePort.name }
                });
                if (this._logging) console.error(err);
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
                this._channel_ports.set(channelName, new Set([newPort]));
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

            if (this._logging) {
                console.log(`${newPort.name} connected:`, newPort);
            }

            // Call the connect listener
            if (this._connectListener) this._connectListener(newPort);

            // Call the message listener for its message type
            runtimePort.onMessage.addListener((msg) => {
                if (this._logging) {
                    console.log(`${newPort.name} message:`, msg);
                }
                const messageListener = this._messageListeners.get(msg.type);
                if (messageListener) {
                    messageListener(msg, newPort);
                } else {
                    if (this._logging) {
                        console.warn('No listener for message type', msg.type);
                    }
                }
            });

            runtimePort.onDisconnect.addListener(() => {
                if (this._logging) {
                    console.log(`${newPort.name} disconnected:`, newPort);
                }
                this._ports.delete(newPort.name);
                this._channel_ports.get(newPort.channelName)?.delete(newPort);
                this._tab_ports.get(newPort.tabId)?.delete(newPort);
                if (this._disconnectListener) {
                    this._disconnectListener(newPort);
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
