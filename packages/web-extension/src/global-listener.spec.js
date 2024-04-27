import { describe, expect, it, vi } from 'vitest';
import { GlobalListener } from './global-listener';

// May need to import browser in the types file and export it from there

describe('GlobalListener Class', () => {
    /*
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
    */

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
    });
});
