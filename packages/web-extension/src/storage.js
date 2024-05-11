// TODO: Create a storage class that will store data in the browser's local
// storage and in memory
// Thinking of making a storage structure argument that will define the
// structure of the storage

/*
structure = {
    tab: {
        type: 'map',
        key: 'number',
        value: {
            recording: false,
            events: {
                type: 'array',
                value: 'unknown',
            },
        },
    },
};


*/

export class Storage {

    constructor({} = {}) {

        /** @type {Map<number, { recording: boolean, events: unknown[] }>} */
        this._tabs = new Map();        

        /** @type {Map<string, { recording: boolean, events: unknown[] }>} */
        this._guides = new Map();
    }

    // Since thinking about how the entire app will look like in advance is
    // too difficult, I'm just going to try and get a feed of events coming 
    // in from rrweb.
    // Each user action records/triggers an animation of the dom. Have to
    // recognize what is a user action is. So an array tuples of user action
    // and the corresponding dom animation. Stop animation right at the
    // beginning of the next user action.
    

}
