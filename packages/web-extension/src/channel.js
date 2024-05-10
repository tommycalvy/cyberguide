import { BaseError } from '@cyberguide/shared';

/** Class that allows content scripts and sidebar scripts to communicate with
*   background scripts.
*/
    
export class Channel {

    /**
        * @param {Object} options
        * @param {string} options.channelName
        * @param {import('./types').NumberSetter} options.setReconnectAttempts
        * @param {string} [options.tabId]
        * @param {boolean} [options.logging]
    */
    constructor({ 
        channelName,
        setReconnectAttempts,
        tabId,
        logging = false
    }) {

        /** @type {string} */
        this._channelName = channelName;

        /** @type {import('./types').NumberSetter} */
        this._setReconnectAttempts = setReconnectAttempts;

        /** @type {string} */
        this._tabId = tabId ? tabId : 'cyberguide';

        /** @type {boolean} */
        this._logging = logging;

        /** @type {string} */
        this._portName = this._channelName + '-' + this._tabId;

        /** @type {import('./types').RuntimePort | null} */
        this._backgroundPort = null;

        /** @type {Map<string, import('./types').MessageListener>} */
        this._messageListeners = new Map();
    }

    /**
        * @param {import('./types').RuntimeConnect} runtimeConnect
        * @returns void
    */
    connect(runtimeConnect) {
        this._backgroundPort = runtimeConnect({ name: this._portName });
        if (this._logging) console.log(this._portName, 'connected');

        this._backgroundPort.onMessage.addListener((msg, runtimePort) => {
            if (this._logging) {
                console.log(this._portName, 'received message:', msg);
            }

            /** @type {import('./types').Port} */
            const port = {
                name: this._portName,
                runtimePort,
                channelName: this._channelName,
                tabId: this._tabId,
            };

            const messageListener = this._messageListeners.get(msg.type);
            if (messageListener) {
                messageListener(msg, port);
            } else {
                if (this._logging) {
                    console.warn('No listener for message type', msg.type);
                }
            }
        });
        this._backgroundPort.onDisconnect.addListener(() => {
            this.reconnect(runtimeConnect);
        });
    }

    /**
        * @returns void
    */
    disconnect() {
        if (this._backgroundPort) {
            this._backgroundPort.disconnect();
            this._backgroundPort = null; // Ensure the old port is cleared
            if (this._logging) console.log(this._portName, 'disconnected');
        }
    }

    /**
        * @param {import('./types').RuntimeConnect} runtimeConnect
        * @returns void
    */
    reconnect(runtimeConnect) {
        this.disconnect(); // Disconnect the current port
        this._setReconnectAttempts((prev) => prev + 1);
        if (this._logging) console.log(this._portName, 'reconnecting');
        this.connect(runtimeConnect); // Reconnect with the new ID
    }

    /**
        * @param {import('./types').MessageType} messageType
        * @param {import('./types').MessageListener} messageListener
        * @returns void
    */
    setMessageListener(messageType, messageListener) {
        this._messageListeners.set(messageType, messageListener);
    }

    /**
        * @param {import('./types').MessageType} messageType
        * @returns {import('@cyberguide/shared/types').Result<null>}
    */
    removeMessageListener(messageType) {
        const removed = this._messageListeners.delete(messageType);
        if (removed) {
            return { success: true, result: null };
        }
        const err = new BaseError('No listener for message type', {
            context: { messageType },
        });
        if (this._logging) console.error(err.message);
        return { success: false, error: err };
    }

    /**
        * @param {import('./types').Message} msg
        * @returns {import('@cyberguide/shared/types').Result<null>}
    */
    send(msg) {
        if (this._backgroundPort) {
            this._backgroundPort.postMessage(msg);
            return { success: true, result: null };
        }
        const err = new Error('Port is not connected');
        if (this._logging) console.error(err.message);
        return { success: false, error: err };
    }
}
