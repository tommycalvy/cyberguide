module.exports = {
    runtime: {
        onConnect: {
            addListener: jest.fn(),
        }
    }
};
