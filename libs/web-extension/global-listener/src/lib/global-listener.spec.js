import { GlobalListener } from './global-listener';

describe('GlobalListener', () => {
    const globalListener = new GlobalListener();

    const allowedChannels = ['sb', 'gb'];

    let mockPort = {
        name: 'sb-123',
        disconnect: jest.fn(),
        onMessage: {
            addListener: jest.fn()
        },
        onDisconnect: {
            addListener: jest.fn()
        },
        postMessage: jest.fn(),
        sender: {
            tab: {
                id: undefined,
            }
        }
    };

    it('should correctly initialize with allowed channels', () => {
        expect(globalListener.allowedChannels).toEqual(allowedChannels);
    });
});
