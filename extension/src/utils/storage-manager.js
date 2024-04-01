import browser from 'webextension-polyfill';

class StorageManager {


    /**
        * Create a StorageManager
        * @param {string} stateId
    */
    constructor(stateId) {
        this.storage = browser.storage.local;
        this.state = null;
        this.stateId = stateId;
    }

    async init() {
        try {
            if (this.state !== null) { 
                throw new Error("StorageManager already initialized");
            }
            const result = await this.storage.get(this.stateId);
            if (result[this.stateId]) {
                this.state = result[this.stateId];
            } else {
                this.state = {};
            }
        } catch (err) {
            console.error(browser.runtime.lastError);
            return new Error(err);
        }
    }

    /**
        * @param {function} success
        * @param {function} failure
        * @returns {function}
    */
    get(success, failure) {
        if (this.state === null) {
            return failure(new Error("StorageManager not initialized"));
        } else {
            return success(this.state);
        }
    }

    /**
        * @param {object} s
        * @returns {Promise<void | Error>}
    */
    async update(s) {
        try {
            if (this.state === null) {
                throw new Error("StorageManager not initialized");
            }
            this.state = s;
            await this.storage.set({ [this.stateId]: this.state });
        } catch (err) {
            console.error(browser.runtime.lastError);
            return new Error(err);
        }
    }

    /**
        * @param {string} stateId
        * @returns {Promise<void | Error>}
    */
    static async remove(stateId) {
        try {
            await browser.storage.local.remove(stateId);
        } catch (err) {
            console.error(browser.runtime.lastError);
            return new Error(err);
        }
    }

}

export default StorageManager;
