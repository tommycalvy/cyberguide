import BrowserStorageWrapper from "./browser-storage-wrapper.js";
import Queue from "./queue.js";

/**
    * Class representing a storage queue for arrays
    * @extends BrowserStorageWrapper
*/
class ArrayStorage extends BrowserStorageWrapper {

    #queue;
    /**
        * Create an ArrayStorage
        * @param {("local"|"sync"|"session"|"managed")} type - Storage type
        * @param {string} key - Key to use
        * @param {Array} value - Value to set
    */
    constructor(type="local", key, value=[]) {
        super(type, key, value);
        this.#queue = new Queue();
    }

    get() {
        return this.#queue.enqueue(super.get());
    }

    /**
        * @param {Array} value
        * @returns {Promise<void>}
    */
//    set(value) {
//        return this.#queue.enqueue(super.set(value));
//    }

    remove() {
        return this.#queue.enqueue(super.remove());
    }

    /**
        * @param {any} promise
        * @returns {Promise<Array>}
        * @memberof ArrayStorage
    */
    push(promise) {
        return this.#queue.enqueue(new Promise(async (resolve, reject) => {
            try {
                let [result, item] = await Promise.all([super.get(), promise]);
                let array = result[super.key];
                array.push(item);
                let newArray = await super.set(array);
                resolve(newArray);
            } catch (err) {
                reject(err);
            }
        }));
    }

    /**
        * @param {any} promise
        * @returns {Promise<Array>}
        * @memberof ArrayStorage
    */
    pushUnique(promise) {
        return this.#queue.enqueue(new Promise(async (resolve, reject) => {
            try {
                let [result, item] = await Promise.all([super.get(), promise]);
                let array = result[super.key];
                if (!array.includes(item)) {
                    array.push(item);
                } else {
                    throw new Error("item already in array");
                }
                let newArray = await super.set(array);
                resolve(newArray);
            } catch (err) {
                reject(err);
            }
        }));
    }

    /**
        * @param {any} promise
        * @returns {Promise<Array>}
        * @memberof ArrayStorage
    */
    removeItem(promise) {
        return this.#queue.enqueue(new Promise(async (resolve, reject) => {
            try {
                let [result, item] = await Promise.all([super.get(), promise]);
                let array = result[super.key];
                let index = array.indexOf(item);
                if (index === -1) {
                    throw new Error("item not in array");
                }
                array.splice(index, 1);
                let newArray = await super.set(array);
                resolve(newArray);
            } catch (err) {
                reject(err);
            }
        }));
    }

    /**
        * @param {any} promise
        * @returns {Promise<boolean>}
        * @memberof ArrayStorage
    */
    includes(promise) {
        return this.#queue.enqueue(new Promise(async (resolve, reject) => {
            try {
                let [result, item] = await Promise.all([super.get(), promise]);
                let array = result[super.key];
                resolve(array.includes(item));
            } catch (err) {
                reject(err);
            }
        }));
    }

    print() {
        return this.#queue.enqueue(new Promise(async (resolve, reject) => {
            try {
                let result = await super.get();
                let array = result[super.key];
                console.log(array);
                resolve(array);
            } catch (err) {
                reject(err);
            }
        }));
    }
}

export default ArrayStorage;
