import browser from "webextension-polyfill";

class Port {
    #portName;
    #logging;
    #listeners;
    /**
        * @param {string} portName
    */ 
    constructor(portName, logging = false) {
        this.#portName = portName;
        this.#logging = logging;
        this.port = browser.runtime.connect({ name: this.#portName });
        this.#listeners = {};
        this.port.onMessage.addListener((msg) => {
            if (msg.type) {
                if (this.#logging) {
                    console.log(this.#portName, ": ", msg.type);
                }
                if (this.#listeners[msg.type]) {
                    this.#listeners[msg.type](msg);
                } else if (this.#logging) {
                    console.error("No listener for msg type:", msg.type);
                }
            } else if (this.#logging) {
                console.error("No msg type from port: ", this.#portName);
            }
        });
    }

    /**
        * @param {any} msg
    */
    postMessage(msg) {
        return this.port.postMessage(msg);
    }

    /**
        * @typedef {object} Message
        * @property {string} Message.type
        * @property {string} [Message.message]
        * @property {any} [Message.data]
    */

    /**
        * @callback OnMessageListener
        * @param {Message} msg
    */

    /**
        * @param {string} msgType
        * @param {OnMessageListener} listener
        * @returns {void}
    */
    onMessage(msgType, listener) {
        this.#listeners[msgType] = listener;
    }

    disconnect() {
        this.port.disconnect();
    }
    
}

export default Port;
