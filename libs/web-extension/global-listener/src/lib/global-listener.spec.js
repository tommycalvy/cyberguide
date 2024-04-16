import browser from 'webextension-polyfill';
import { GlobalListener } from './global-listener';

//jest.mock('webextension-polyfill');

describe('GlobalListener', () => {

    const mockSidebarPort = {
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

    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it('should initialize correctly', () => {
        const emptyMap = new Map();
        const initializedChannels = new Set(['sb', 'gb']);

        const gl = new GlobalListener();

        expect(gl._allowedChannels).toEqual(initializedChannels);
        expect(gl._connectListener).toBeNull();
        expect(gl._disconnectListener).toBeNull();
        expect(gl._messageListeners).toEqual(emptyMap);
        expect(gl._ports).toEqual(emptyMap);
        expect(gl._channel_ports).toEqual(emptyMap);
        expect(gl._tab_ports).toEqual(emptyMap);
    });

    it('successfully accepts a sidebar connection', () => {
        const gl = new GlobalListener();
        const mockErrorCallback = jest.fn();
        gl.startListening(mockErrorCallback);

        /** @type {Function} */
        const addListenerCallback = browser.runtime.onConnect.addListener.mock.calls[0][0];
        addListenerCallback(mockSidebarPort);

        expect(mockErrorCallback).not.toHaveBeenCalled();
    });
});
