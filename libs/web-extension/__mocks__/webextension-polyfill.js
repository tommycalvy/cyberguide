module.exports = {
    runtime: {
        onConnect: {
            /** @type {import('./types').AddListenerMock}*/
            addListener: jest.fn(callback => {
                callback();
            }),
        }
    }
};
