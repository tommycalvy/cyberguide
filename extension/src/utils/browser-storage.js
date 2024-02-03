import browser from "webextension-polyfill";
class BrowserStorage {
    #key;
    /**
        * Create a BrowserStorageWrapper
        * @param {("local"|"session")} type - Storage type
        * @param {string} key - Key to use
        * @param {any} value - Value to set
        * @memberof BrowserStorageWrapper
        * @inner
    */
    constructor(type="local", key, value=null) {
        this.#key = key;
        
        switch (type) {
            case "local":
                this.storage = browser.storage.local;
                break;
            case "session":
                this.storage = browser.storage.session;
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

export default BrowserStorage;
