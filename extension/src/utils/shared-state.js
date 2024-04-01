import StorageManager from '../utils/storage-manager.js';

class SharedState {

    /**
        * @param {StorageManager} storageManager
    */
    constructor(storageManager) {
        this.sm = storageManager;
    }

    get(key) {
        return this.state[key];
    }
    set(key, value) {
        this.state[key] = value;
    }
}

export default SharedState;
