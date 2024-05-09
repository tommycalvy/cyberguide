import { vi } from 'vitest';

/**
    * @param {string} name
    * @param {number|undefined} tabId
**/
export function createMockPort(name, tabId) {
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
