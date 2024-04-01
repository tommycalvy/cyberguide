import browser from "webextension-polyfill";

/** Class that creates a runtime.onConnect listener and returns the ports */
class MessageListener {
    #ports;
    #logging;
    /**
        * Create a MessageListener
        * @param {boolean} logging - Log messages
    */
    constructor(logging = false) {
        this.#logging = logging;
        this.#ports = {};
        browser.runtime.onConnect.addListener((port) => {
            if (this.#logging) console.log(port.name, " connected");
            if (this.#ports[port.name]) {
                let p = this.#ports[port.name];
                if (!p.port) {
                    p.port = port;
                    p.connected = true;
                }
                port.onMessage.addListener((msg) =>  {
                    if (msg.type) {
                        if (this.#logging) {
                            console.log(port.name, ": ", msg.type);
                        }
                        if (p.listeners[msg.type]) {
                            p.listeners[msg.type](msg);
                        } else if (this.#logging) {
                            console.error(
                                "No listener for msg type:", 
                                msg.type
                            );
                        }
                    } else if (this.#logging) {
                        console.error("No msg type from port: ", port.name);
                    }
                });
            } else if (this.#logging) {
                console.error("No listener for port: ", port.name);
            }
            port.onDisconnect.addListener(() => {
                if (this.#logging) console.log(port.name, " disconnected");
                if (this.#ports[port.name]) {
                    this.#ports[port.name].connected = false;
                }
            }); 
        });
    }
    //TODO: add Global Listener so that all ports can listen to a message
    /**
        * @param {string} portName
        * @memberof MessageListener
        * @inner
        * @returns {void}
    */
    addPort(portName) {
        let p = {
            listeners: {},
            port: null,
            connected: false
        };
        this.#ports[portName] = p;
    }
   
    /**
        * @param {string} portName
        * @returns {Promise<any>}
    */
    getPort(portName) {
        return new Promise((resolve, reject) => {
            if (!this.#ports[portName]) {
                reject(new Error(`No port with name: ${portName}`));
            } else if (!this.#ports[portName].port) {
                reject(new Error(`Port ${portName} has null port`));
            } else if (!this.#ports[portName].connected) {
                reject(new Error(`Port ${portName} is disconnected`));
            } else {
                resolve(this.#ports[portName].port);
            }
        });
    }

    /**
        * @param {string} portName
        * @param {string} msgType
        * @param {function} listener
        * @returns {void}
        * @throws {Error}
    */
    addMsgListener(portName, msgType, listener) {
        if (!this.#ports[portName]) {
            throw new Error(`No port with name: ${portName}`);
        }
        this.#ports[portName].listeners[msgType] = listener;
    }
}

class Port {

    #portName;
    #msgListener;

    /**
        * Create a BrowserMessage
        * @param {string} portName - Port name
        * @param {MessageListener} msgListener - Message listener
    */
    constructor(portName, msgListener) {
        this.#portName = portName;
        this.#msgListener = msgListener;
        this.#msgListener.addPort(this.#portName);
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
        * @throws {Error}
    */
    onMessage(msgType, listener) {
        this.#msgListener.addMsgListener(this.#portName, msgType, listener);
    }

    /**
        * @param {Message} msg
        * @returns {Promise<any>}
        * @throws {Error} No msg type
        * @throws {Error} No port with name
        * @throws {Error} Port has null port
        * @throws {Error} Port is disconnected
    */
    postMessage(msg) {
        if (!msg.type) {
            throw new Error("No msg type");
        }
        return new Promise(async (resolve, reject) => {
            this.#msgListener.getPort(this.#portName).then((port) => {
                return port.postMessage(msg)
            }).then((val) => {
                    resolve(val);
            }).catch((err) => {
                    reject(err);
            });
        });
    }

}

export { MessageListener, Port };
