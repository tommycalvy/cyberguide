import { describe, expect, it } from 'vitest';
import { GlobalListener } from './global-listener';

describe('GlobalListener Class', () => {
    const mockSidebarPort = {
        name: 'sb-123',
        disconnect: jest.fn(),
        onMessage: {
            addListener: jest.fn(),
            removeListener: jest.fn(),
            hasListener: jest.fn(),
            hasListeners: jest.fn(),
        },
        onDisconnect: {
            addListener: jest.fn(),
            removeListener: jest.fn(),
            hasListener: jest.fn(),
            hasListeners: jest.fn(),
        },
        postMessage: jest.fn(),
        sender: {
            tab: {
                id: undefined,
                index: 0,
                highlighted: false,
                active: false,
                pinned: false,
                incognito: false,
            }
        }
    };

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
        runtimeSpy.onConnect.addListener.mockImplementationOnce(callback => {
            callback(mockSidebarPort);
        });
        const gl = new GlobalListener();
        const mockErrorCallback = jest.fn();
        gl.startListening(mockErrorCallback);

        //const addListenerCallback = browser.runtime.onConnect.addListener.mock.calls[0][0];
        
        /** @type {jest.MockedFunction<(callback: (port: browser.Runtime.Port) => void) => void>} */
        const addListener = browser.runtime.onConnect.addListener;
        const addListenerCallback = addListener.mock.calls[0][0];

        addListenerCallback(mockSidebarPort);

        expect(mockErrorCallback).not.toHaveBeenCalled();
    });
});
