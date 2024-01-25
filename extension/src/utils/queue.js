class Queue {

    #array;
    #workingOnPromise;

    constructor() {
        this.#array = [];
        this.#workingOnPromise = false;
    }

    /**
        * @param {Promise<any>} promise
        * @memberof Queue
        * @inner
        * @returns {Promise<any>}
    */
    enqueue(promise) {
        return new Promise((resolve, reject) => {
            this.#array.push({
                promise,
                resolve,
                reject,
            });
            this.#dequeue();
        });
    }

    #dequeue() {
        if (this.#workingOnPromise) {
            return false;
        }
        const item = this.#array.shift();
        if (!item) {
            return false;
        }
        try {
            this.#workingOnPromise = true;
            Promise.resolve(item.promise)
                .then((value) => {
                    this.#workingOnPromise = false;
                    item.resolve(value);
                    this.#dequeue();
                })
                .catch(err => {
                    this.#workingOnPromise = false;
                    item.reject(err);
                    this.#dequeue();
                })
        } catch (err) {
            this.#workingOnPromise = false;
            item.reject(err);
            this.#dequeue();
        }
        return true;
    }
}

export default Queue;
