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

    get() {
        return this.#queue.enqueue(new Promise((resolve, reject) => {
            super.get().then((result) => {
                return result[super.key];
            }).then((array) => {
                if (Array.isArray(array)) {
                    resolve(array);
                } else {
                    reject(new Error("stored object is not an array"));
                }
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
        return this.#queue.enqueue(new Promise((resolve, reject) => {
            if (!Array.isArray(values)) {
                reject(new Error("value is not an array"));
            } else {
                super.set(values).then((result) => {
                    resolve(result);
                }).catch((err) => {
                    reject(err);
                });
            }
        }));
    }

    remove() {
        return this.#queue.enqueue(super.remove());
    }

    /**
        * @param {any} promise
        * @returns {Promise<Array>}
        * @memberof ArrayStorage
    */
    push(promise) {
        return this.#queue.enqueue(new Promise((resolve, reject) => {
            Promise.all([super.get(), promise]).then(([result, item]) => {
                return [result[super.key], item];
            }).then(([array, item]) => {
                if (Array.isArray(array)) {
                    array.push(item);
                } else if (array === null || array === undefined) {
                    array = [item]; 
                } else {
                    throw new Error("stored object is not an array");
                }
                return [super.set(array), item];
            }).then(([newArray, item]) => {
                resolve([newArray, item]);
            }).catch((err) => {
                reject(err);
            });
        }));
    }

    /**
        * @param {any} promise
        * @returns {Promise<Array>}
        * @memberof ArrayStorage
    */
    pushUnique(promise) {
        return this.#queue.enqueue(new Promise((resolve, reject) => {
            Promise.all([super.get(), promise]).then(([result, item]) => {
                return [result[super.key], item];
            }).then(([array, item]) => {
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
                return [super.set(array), item];
            }).then(([newArray, item]) => {
                resolve([newArray, item]);
            }).catch((err) => {
                reject(err);
            });
        }));
    }

    /**
        * @param {any} promise
        * @returns {Promise<Array>}
        * @memberof ArrayStorage
    */
    removeItem(promise) {
        return this.#queue.enqueue(new Promise((resolve, reject) => {
            Promise.all([super.get(), promise]).then(([result, item]) => {
                return ([result[super.key], item]);
            }).then(([array, item]) => {
                let index = array.indexOf(item);
                if (index === -1) {
                    throw new Error("item not in array");
                }
                array.splice(index, 1);
                return super.set(array);
            }).then((newArray) => {
                resolve(newArray);
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
                if (Array.isArray(array)) {
                    return array.includes(item);
                } else {
                    throw new Error("stored object is not an array");
                }
            }).then((result) => {
                resolve(result);
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
                if (Array.isArray(array)) {
                    console.log(array);
                } else {
                    throw new Error("stored object is not an array");
                }
                resolve(array);
            }).catch((err) => {
                reject(err);
            });
        }));
    }
}

export default ArrayStorage;
