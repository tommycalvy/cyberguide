import browser from "webextension-polyfill";

/** Class that manages the state of the extension */
class StateStorageManager {

    /**
        * Create a StateStorageManager
    */
    constructor() {
        this.storage = browser.storage.local;
        this.ls = null;
        this.state = null;
        this.lsName = "listOfStates";
    }

    async init() {
        this.ls = await this.initListOfStates();
        this.state = await this.initState(this.ls);
    }

    /**
        * @returns {Promise<Set<string>>}
    */
    async initListOfStates() {
        try {
            const ls = new Set();
            const result = await this.storage.get(this.lsName);
            if (result.ls && Array.isArray(result.ls)) {
                result.ls.forEach((key) => {
                    if (typeof key !== "string") {
                        throw new Error("browser.local.ls has non-string");
                    }
                    if (ls.has(key)) {
                        throw new Error("browser.local.ls has duplicates");
                    }
                    ls.add(key)
                });
            } else {
                throw new Error("browser.local.ls is not an array");
            }
            return ls; 
        } catch(err) {
            console.error(err);
            return new Set();
        }
    }

    /**
        * @param {Set<string>} ls
        * @returns {Promise<Map<string, any>>}
    */
    async initState(ls) {
        try {
            const state = new Map();
            const result = await this.storage.get([...ls]);
            ls.forEach((key) => {
                if (result[key]) {
                    state.set(key, result[key]);
                } else {
                    throw new Error(`browser.local.${key} is not there`);
                }
            });
            return state;
        } catch(err) {
            console.error(err);
            return new Map();
        }
    }

    /**
        * @param {string} s
        * @param {any} value
        * @returns {Promise<void>}
    */
    async addState(s, value) {
        try {  
            if (!this.ls || !this.state) {
                throw new Error("StateManager not initialized");
            }
            if (!this.ls.has(s)) {
                await this.storage.set({ [s]: value });
                await this.storage.set({ ls: [...this.ls, s]}).catch((err) => {
                    console.log("Error setting ls");
                    this.storage.remove(s).catch((err) => {
                        console.log("Error removing state from storage");
                        console.error(err);
                    });
                    throw err;
                });
                this.ls.add(s);
                this.state.set(s, value);
            } else {
                throw new Error(`StateManager already has ${s}`);
            }
        } catch(err) {
            console.error(err);
        }
    }

    /**
        * @param {string} s
        * @returns {Promise<void>}
    */
    async removeState(s) {
        try {
            if (!this.ls || !this.state) {
                throw new Error("StateManager not initialized");
            }
            if (this.ls.has(s)) {
                this.state.delete(s);
                this.ls.delete(s);                      
                await this.storage.remove(s).catch((err) => {
                    console.log("Error removing state from storage");
                    console.error(err);
                });
                await this.storage.set({ [s]: [...this.ls]}).catch((err) => {
                    console.log("Error setting ls");
                    console.error(err);
                });
            } else {
                throw new Error(`StateManager does not have ${s} in ls`);
            }
        } catch(err) {
            console.error(err);
        }
    }

    /**
        * @param {string} s
        * @param {any} value
        * @returns {Promise<void>}
    */
    async updateState(s, value) {
        try {
            const state = this.state;
            if (!this.ls || !state) {
                throw new Error("StateManager not initialized");
            }
            if (this.ls.has(s)) {
                const old = state.get(s);
                state.set(s, value);
                await this.storage.set({ [s]: value }).catch((err) => {
                    console.log("Error updating state");
                    state.set(s, old);
                    throw err; 
                });
            } else {
                throw new Error(`StateManager does not have ${s} in ls`);
            }
        } catch(err) {
            console.error(err);
        }
    }

    /**
        * @param {string} s
        * @param {function} success
        * @param {function} failure
        * @returns {function}
    */
    getState(s, success, failure) {
        if (!this.ls || !this.state) {
            return failure(new Error("StateManager not initialized"));
        }
        if (this.ls.has(s)) {
            return success(this.state.get(s));
        } else {
            return failure(new Error(`StateManager does not have ${s} in ls`));
        }
    }
}

export default StateStorageManager;
