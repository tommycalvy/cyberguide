import BrowserStorage from "../utils/browser-storage.js";
import Queue from "../utils/queue.js";

/**
    * Class representing a storage queue for arrays
    * @extends BrowserStorage
*/
class ArrayStorage extends BrowserStorage {

    #queue;
    /**
        * Create an ArrayStorage
        * @param {("local"|"session")} type - Storage type
        * @param {string} key - Key to use
        * @param {Array | null} value - Value to set
    */
    constructor(type="local", key, value=null) {
        super(type, key, value);
        this.#queue = new Queue();
    }
    
    /**
        * @returns {Promise<Array>}
    */
    get() {
        return this.#queue.enqueue(new Promise((resolve, reject) => {
            super.get().then((result) => {
                return result[super.key];
            }).then((array) => {
                if (!Array.isArray(array)) {
                    throw new Error("stored object is not an array");
                }
                resolve(array);
            }).catch((err) => {
                reject(err);
            });
        }));
    }

    /**
        * @param {Array} values
        * @returns {Promise<void>}
    */
    replaceValues(values) {
        if (!Array.isArray(values)) {
            throw new Error("value is not an array");
        }
        return this.#queue.enqueue(new Promise((resolve) => { 
            resolve(super.set(values));
        }));
    }

    remove() {
        return this.#queue.enqueue(super.remove());
    }

    /**
        * @param {Promise<any>} promise
        * @returns {Promise<[Array, any]>}
    */
    push(promise) {
        return this.#queue.enqueue(new Promise((resolve, reject) => {
            Promise.all([super.get(), promise]).then(([result, item]) => {
                return [result[super.key], item];
            }).then(async ([array, item]) => {
                if (Array.isArray(array)) {
                    array.push(item);
                } else if (array === null || array === undefined) {
                    array = [item]; 
                } else {
                    throw new Error("stored object is not an array");
                }
                await super.set(array);
                resolve([array, item]);
            }).catch((err) => {
                reject(err);
            });
        }));
    }

    /**
        * @param {Promise<any>} promise
        * @returns {Promise<[Array, any]>}
    */
    pushUnique(promise) {
        return this.#queue.enqueue(new Promise((resolve, reject) => {
            Promise.all([super.get(), promise]).then(([result, item]) => {
                return [result[super.key], item];
            }).then(async ([array, item]) => {
                if (Array.isArray(array)) {
                    if (!array.includes(item)) {
                        array.push(item);
                    } else {
                        throw new Error("item already in array");
                    }
                } else if (array === null || array === undefined) {
                    array = [item]; 
                } else {
                    throw new Error("stored object is not an array");
                }
                await super.set(array);
                resolve([array, item]);
            }).catch((err) => {
                reject(err);
            });
        }));
    }

    /**
        * @param {Promise<any>} promise
        * @returns {Promise<[Array, any]>}
    */
    removeItem(promise) {
        return this.#queue.enqueue(new Promise((resolve, reject) => {
            Promise.all([super.get(), promise]).then(([result, item]) => {
                return ([result[super.key], item]);
            }).then(async ([array, item]) => {
                let index = array.indexOf(item);
                if (index === -1) {
                    throw new Error("item not in array");
                }
                array.splice(index, 1);
                await super.set(array);
                resolve([array, item]);
            }).catch((err) => {
                reject(err);
            });
        }));
    }

    /**
        * @param {any} promise
        * @returns {Promise<boolean>}
        * @memberof ArrayStorage
    */
    includes(promise) {
        return this.#queue.enqueue(new Promise((resolve, reject) => {
            Promise.all([super.get(), promise]).then(([result, item]) => {
                return [result[super.key], item];
            }).then(([array, item]) => {
                if (!Array.isArray(array)) {
                    throw new Error("stored object is not an array");
                }
                resolve(array.includes(item));
            }).catch((err) => {
                reject(err);
            });
        }));
    }

    print() {
        return this.#queue.enqueue(new Promise((resolve, reject) => {
            super.get().then((result) => {
                return result[super.key];
            }).then((array) => {
                if (!Array.isArray(array)) {
                    throw new Error("stored object is not an array");
                }
                console.log(array);
                resolve(array);
            }).catch((err) => {
                reject(err);
            });
        }));
    }
}

export default ArrayStorage;
