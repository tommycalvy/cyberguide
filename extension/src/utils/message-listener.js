import browser from "../utils/browser-namespace.js";

class MessageListener {
    #ports;
    #pendingMessages;
    /**
        * Create a MessageListener
        * @param {boolean} logging - Log messages
        * @memberof MessageListener
        * @inner
        * @returns {void}
    */
    contructor(logging = false) {
        this.logging = logging;
        this.#ports = {};
        this.#pendingMessages = [];
        browser.runtime.onConnect.addListener((port) => {
            if (this.logging) console.log(port.name, " connected");
            port.onMessage.addListener((msg) =>  {
                if (msg.type) {
                    if (this.logging) console.log(port.name, ": ", msg.type);
                    if (this.#ports[port.name]) {
                        let p = this.#ports[port.name];
                        if (p.listener[msg.type]) {
                            p.listener[msg.type](msg);
                        }
                    }
                }
            });
            port.onDisconnect.addListener(() => {
                if (this.logging) console.log(port.name, " disconnected");
            });
            while (true) {
                if (this.#pendingMessages.length > 0) {
                    let msg = this.#pendingMessages.shift();
                    port.postMessage(msg);
                }
            }
        });
    }

    /**
        * @param {string} portName
        * @param {function} listener
        * @memberof MessageListener
        * @inner
        * @returns {void}
    */
    addPort(portName, listener=() => {}) {
        this.#ports.set(portName, listener);
    }

    /**
        * @param {string} portName
        * @param {object} msg
        * @memberof MessageListener
        * @inner
        * @returns {void}
    */
    addPendingMessage(portName, msg) {
        this.#pendingMessages.push({ portName, msg });
    }
}

class Port {

    #portName;
    #messageListener;
    #listeners;

    /**
        * Create a BrowserMessage
        * @param {string} portName - Port name
        * @param {MessageListener} messageListener - Message listener
        * @param {boolean} logging - Log messages
        * @memberof BrowserMessage
        * @inner
        * @returns {void}
    */
    contructor(portName, messageListener) {
        this.#portName = portName;
        this.#messageListener = messageListener;
        this.#listeners = {};
    }

    onMessage(type, listener) {
        if (this.#listeners[type]) {
            throw new Error(`Listener for type ${type} already exists`);
        }
        this.#listeners[type] = listener;
        this.#messageListener.addPort(this.#portName, this.#listeners);
    }

    postMessage(msg) {
        return new Promise((resolve, reject) => {
            this.#messageListener.addPendingMessage({
                portName: this.#portName,
                msg,
                resolve,
                reject
            });
        });
    }

}

export { MessageListener, Port };
