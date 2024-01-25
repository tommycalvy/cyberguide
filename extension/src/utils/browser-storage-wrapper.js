import browser from "webextension-polyfill";

class BrowserStorageWrapper {
    #key;
    /**
        * Create a BrowserStorageWrapper
        * @param {("local"|"sync"|"session"|"managed")} type - Storage type
        * @param {string} key - Key to use
        * @param {any} value - Value to set
        * @memberof BrowserStorageWrapper
        * @inner
    */
    constructor(type="local", key, value) {
        this.#key = key;
        switch (type) {
            case "local":
                this.storage = browser.storage.local;
                break;
            case "sync":
                this.storage = browser.storage.sync;
                break;
            case "session":
                this.storage = browser.storage.session;
                break;
            case "managed":
                this.storage = browser.storage.managed;
                break;
            default:
                throw new Error(`Unknown storage type: ${type}`);
        }
        if (value) {
            this.set(value);
        }
    }

    get() {
        return this.storage.get(this.#key);
    }
    
    /**
        * @param {any} value
        * @memberof BrowserStorageWrapper
        * @inner
        * @returns {Promise<void>}
    */
    set(value) {
        return this.storage.set({ [this.#key]: value });
    }

    remove() {
        return this.storage.remove(this.#key);
    }

    get key() {
        return this.#key;
    }
}

export default BrowserStorageWrapper;
