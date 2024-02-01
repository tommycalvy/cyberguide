import browser from "../utils/browser-namespace.js";

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

    postMessage(msg) {
        return this.port.postMessage(msg);
    }

    /**
        * @param {string} msgType
        * @param {function} listener
        * @memberof Port
        * @inner
        * @returns {void}
        * @throws {Error} No message type provided
    */
    onMessage(msgType, listener) {
        if (msgType) {
            this.#listeners[msgType] = listener;
        } else {
            throw new Error("No message type provided");
        }
    }

    disconnect() {
        this.port.disconnect();
    }
    
}

export default Port;
