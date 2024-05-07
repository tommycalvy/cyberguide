import { describe, expect, it, vi } from 'vitest';
import { GlobalListener } from './global-listener';

/**
    * @param {string} name
    * @param {number|undefined} tabId
    * @returns {import('./types').RuntimePort}
**/
function createMockPort(name, tabId) {
    return {
        name,
        sender: {
            tab: {
                id: tabId,
                index: 0,
                highlighted: false,
                active: false,
                pinned: false,
                incognito: false,
            }
        },
        disconnect: vi.fn(),
        onMessage: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
            hasListener: vi.fn(),
            hasListeners: vi.fn(),
        },
        onDisconnect: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
            hasListener: vi.fn(),
            hasListeners: vi.fn(),
        },
        postMessage: vi.fn(),
    };
}

describe('GlobalListener', () => {

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

    it('successfully accepts a Sidebar connection', () => {
        const gl = new GlobalListener({ logging: true});

        /** @type {import('./types').Callback[]} */
        let messageListeners = [];

        /** @type {import('./types').OnConnect} */
        const mockOnConnect = {
            addListener: (callback) => {
                messageListeners.push(callback);
            },
            removeListener: vi.fn(),
            hasListeners: vi.fn(),
            hasListener: vi.fn(),
        };
        const mockErrorCallback = vi.fn();

        gl.startListening(mockOnConnect, mockErrorCallback);

        expect(messageListeners[0]).not.toBeNull();

        const mockSidebarPort = createMockPort('sb-123', undefined);
        messageListeners.forEach((listener) => listener(mockSidebarPort));

        expect(mockErrorCallback).not.toHaveBeenCalled();

        const port = gl._ports.get('sb-123');
        expect(port).not.toBeUndefined();
        if (port) {
            expect(port.name).toBe('sb-123');
            expect(port.channelName).toBe('sb');
            expect(port.tabId).toBe('123');
            expect(port.runtimePort).toBe(mockSidebarPort);

            const channelPorts = gl._channel_ports.get('sb');
            expect(channelPorts).not.toBeUndefined();
            if (channelPorts) {
                expect(channelPorts.has(port)).toBe(true);
            }

            const tabPorts = gl._tab_ports.get('123');
            expect(tabPorts).not.toBeUndefined();
            if (tabPorts) {
                expect(tabPorts.has(port)).toBe(true);
            }
        }

    });

    it('successfully accepts a GuideBuilder connection', () => {
        const gl = new GlobalListener({ logging: true});

        /** @type {import('./types').Callback[]} */
        let messageListeners = [];

        /** @type {import('./types').OnConnect} */
        const mockOnConnect = {
            addListener: (callback) => {
                messageListeners.push(callback);
            },
            removeListener: vi.fn(),
            hasListeners: vi.fn(),
            hasListener: vi.fn(),
        };
        const mockErrorCallback = vi.fn();

        gl.startListening(mockOnConnect, mockErrorCallback);

        expect(messageListeners[0]).not.toBeNull();

        const mockGuideBuilderPort = createMockPort('gb-123', 234);
        messageListeners.forEach((listener) => listener(mockGuideBuilderPort));

        expect(mockErrorCallback).not.toHaveBeenCalled();

        const port = gl._ports.get('gb-234');
        expect(port).not.toBeUndefined();
        if (port) {
            expect(port.name).toBe('gb-234');
            expect(port.channelName).toBe('gb');
            expect(port.tabId).toBe('234');
            expect(port.runtimePort).toBe(mockGuideBuilderPort);

            const channelPorts = gl._channel_ports.get('gb');
            console.log(channelPorts);
            expect(channelPorts).not.toBeUndefined();
            if (channelPorts) {
                expect(channelPorts.size).toBe(1);
                expect(channelPorts.has(port)).toBe(true);
            }

            const tabPorts = gl._tab_ports.get('234');
            expect(tabPorts).not.toBeUndefined();
            if (tabPorts) {
                expect(tabPorts.size).toBe(1);
                expect(tabPorts.has(port)).toBe(true);
            }
        }
    });

    it('should reject an invalid channel', () => {
        const gl = new GlobalListener({ logging: true});

        /** @type {import('./types').Callback[]} */
        let messageListeners = [];

        /** @type {import('./types').OnConnect} */
        const mockOnConnect = {
            addListener: (callback) => {
                messageListeners.push(callback);
            },
            removeListener: vi.fn(),
            hasListeners: vi.fn(),
            hasListener: vi.fn(),
        };
        const mockErrorCallback = vi.fn();

        gl.startListening(mockOnConnect, mockErrorCallback);

        expect(messageListeners[0]).not.toBeNull();

        const mockInvalidPort = createMockPort('invalid-123', 234);
        messageListeners.forEach((listener) => listener(mockInvalidPort));

        expect(mockErrorCallback).toHaveBeenCalled();
        const err = mockErrorCallback.mock.calls[0][0];
        expect(err.message).toBe('Invalid channel');
    });

    it('should reject a port with an invalid tabId', () => {
        const gl = new GlobalListener({ logging: true});

        /** @type {import('./types').Callback[]} */
        let messageListeners = [];

        /** @type {import('./types').OnConnect} */
        const mockOnConnect = {
            addListener: (callback) => {
                messageListeners.push(callback);
            },
            removeListener: vi.fn(),
            hasListeners: vi.fn(),
            hasListener: vi.fn(),
        };
        const mockErrorCallback = vi.fn();

        gl.startListening(mockOnConnect, mockErrorCallback);

        expect(messageListeners[0]).not.toBeNull();

        const mockInvalidPort = createMockPort('sb-invalid', undefined);
        messageListeners.forEach((listener) => listener(mockInvalidPort));

        expect(mockErrorCallback).toHaveBeenCalled();
        const err = mockErrorCallback.mock.calls[0][0];
        expect(err.message).toBe('tabId is not a number');
    });

    it('should reject a port with no tabId', () => {
        const gl = new GlobalListener({ logging: true});

        /** @type {import('./types').Callback[]} */
        let messageListeners = [];

        /** @type {import('./types').OnConnect} */
        const mockOnConnect = {
            addListener: (callback) => {
                messageListeners.push(callback);
            },
            removeListener: vi.fn(),
            hasListeners: vi.fn(),
            hasListener: vi.fn(),
        };
        const mockErrorCallback = vi.fn();

        gl.startListening(mockOnConnect, mockErrorCallback);

        expect(messageListeners[0]).not.toBeNull();

        const mockInvalidPort = createMockPort('sb', undefined);
        messageListeners.forEach((listener) => listener(mockInvalidPort));

        expect(mockErrorCallback).toHaveBeenCalled();
        const err = mockErrorCallback.mock.calls[0][0];
        expect(err.message).toBe('No tabId in port.sender or port.name');
    });
});
