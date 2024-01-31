import browser from "../utils/browser-namespace.js";

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
                        if (p.listener[msg.type]) {
                            p.listener[msg.type](msg);
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
        * memberof MessageListener
        * @inner
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
            }
            resolve(this.#ports[portName].port);
        });
    }

    /**
        * @param {string} portName
        * @param {string} msgType
        * @param {function} listener
        * @memberof MessageListener
        * @inner
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
    #messageListener;

    /**
        * Create a BrowserMessage
        * @param {string} portName - Port name
        * @param {MessageListener} messageListener - Message listener
    */
    constructor(portName, messageListener) {
        this.#portName = portName;
        this.#messageListener = messageListener;
        this.#messageListener.addPort(this.#portName);
    }

    /**
        * @param {string} msgType
        * @param {function} listener
        * @memberof Port
        * @inner
        * @returns {void}
        * @throws {Error}
    */
    onMessage(msgType, listener) {
        if (!msgType) {
            throw new Error("No message type provided");
        }
        this.#messageListener.addMsgListener(this.#portName, msgType, listener);
    }

    postMessage(msg) {
        return new Promise(async (resolve, reject) => {
            if (!msg.type) {
                reject(new Error("No msg type"));
            }
            let port = await this.#messageListener.getPort(this.#portName)
                .catch((err) => {
                    reject(err);
                });
            port.postMessage(msg).then((val) => {
                    resolve(val);
                }).catch((err) => {
                    reject(err);
                });
        });
    }

}

export { MessageListener, Port };
