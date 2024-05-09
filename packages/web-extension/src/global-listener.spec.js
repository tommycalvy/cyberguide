import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GlobalListener } from './global-listener';
import { createMockPort } from './create-mock-port';

describe('GlobalListener', () => {

    it('initializes correctly', () => {
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

    describe('onConnect', () => {
        
        it('adds a connect listener', () => {
            const gl = new GlobalListener();

            const mockListener = vi.fn();
            gl.onConnect(mockListener);

            expect(gl._connectListener).toBe(mockListener);
        });

    });

    describe('onDisconnect', () => {

        it('adds a disconnect listener', () => {
            const gl = new GlobalListener();

            const mockListener = vi.fn();
            gl.onDisconnect(mockListener);

            expect(gl._disconnectListener).toBe(mockListener);
        });
    });

    describe('onMessage', () => {

        it('adds a message listener for the given message type', () => {
            const gl = new GlobalListener();

            const mockListener = vi.fn();
            gl.onMessage('test', mockListener);

            const listener = gl._messageListeners.get('test');
            expect(listener).toBe(mockListener);
        });
    });

    describe('startListening', () => {

        /**
            * @typedef {Object} TestContext
            * @property {GlobalListener} gl
            * @property {import('./types').Callback[]} messageListeners
            * @property {any} mockErrorCallback
        */

        beforeEach((/** @type {TestContext} */ context) => {

            const gl = new GlobalListener({ logging: true});

            /** @type {import('./types').Callback[]} */
            const messageListeners = [];

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

            context.gl = gl;
            context.messageListeners = messageListeners;
            context.mockErrorCallback = mockErrorCallback;
        });

        it('accepts a Sidebar connection', (/** @type {TestContext} */ {
            gl,
            messageListeners,
            mockErrorCallback,
        }) => {

            expect(messageListeners[0]).not.toBeNull();

            const mockSidebarPort = createMockPort('sb-123', undefined);
            messageListeners[0](mockSidebarPort);

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

        it('accepts a GuideBuilder connection', (/** @type {TestContext} */ {
            gl,
            messageListeners,
            mockErrorCallback,
        }) => {
            expect(messageListeners[0]).not.toBeNull();

            const mockGuideBuilderPort = createMockPort('gb-123', 234);
            messageListeners[0](mockGuideBuilderPort);

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

        it('rejects a port with an invalid channel', (
            /** @type {TestContext} */ 
        {
            messageListeners,
            mockErrorCallback,
        }) => {

            expect(messageListeners[0]).not.toBeNull();

            const mockInvalidPort = createMockPort('invalid-123', 234);
            messageListeners[0](mockInvalidPort);

            expect(mockErrorCallback).toHaveBeenCalled();
            const err = mockErrorCallback.mock.calls[0][0];
            expect(err.message).toBe('Invalid channel');
        });

        it('rejects a port with an invalid tabId', (
            /** @type {TestContext} */
        {
            messageListeners,
            mockErrorCallback,
        }) => {
            expect(messageListeners[0]).not.toBeNull();

            const mockInvalidPort = createMockPort('sb-invalid', undefined);
            messageListeners[0](mockInvalidPort);

            expect(mockErrorCallback).toHaveBeenCalled();
            const err = mockErrorCallback.mock.calls[0][0];
            expect(err.message).toBe('tabId is not a number');
        });

        it('rejects a port with no tabId', (/** @type {TestContext} */ {
            messageListeners,
            mockErrorCallback,
        }) => {
            expect(messageListeners[0]).not.toBeNull();

            const mockInvalidPort = createMockPort('sb', undefined);
            messageListeners[0](mockInvalidPort);

            expect(mockErrorCallback).toHaveBeenCalled();
            const err = mockErrorCallback.mock.calls[0][0];
            expect(err.message).toBe('No tabId in port.sender or port.name');
        });

        it('calls the connect listener when a new port is connected', (
            /** @type {TestContext} */
        {
            gl,
            messageListeners,
            mockErrorCallback,
        }) => {
            const mockConnectListener = vi.fn();
            gl.onConnect(mockConnectListener);

            expect(messageListeners[0]).not.toBeNull();

            const mockGuideBuilderPort = createMockPort('gb-cyberguide', 234);
            messageListeners[0](mockGuideBuilderPort);

            expect(mockErrorCallback).not.toHaveBeenCalled();
            expect(mockConnectListener).toHaveBeenCalled();
        });

        it('calls the correct message listener when a new message comes', (
            /** @type {TestContext} */
        {
            gl,
            messageListeners,
            mockErrorCallback,
        }) => {
            const mockMessageListener = vi.fn();
            gl.onMessage('test', mockMessageListener);

            expect(messageListeners[0]).not.toBeNull();

            const mockGuideBuilderPort = createMockPort('gb-cyberguide', 234);
            messageListeners[0](mockGuideBuilderPort);

            expect(mockErrorCallback).not.toHaveBeenCalled();

            const sendMockMessage = mockGuideBuilderPort
                .onMessage.addListener.mock.calls[0][0];
            sendMockMessage({ type: 'test', data: 'test data' });

            expect(mockMessageListener).toHaveBeenCalled();
            expect(mockMessageListener.mock.calls[0][0])
                .toEqual({ type: 'test', data: 'test data' });
        });

        it('calls the disconnect listener when a port is disconnected', (
            /** @type {TestContext} */
        {
            gl,
            messageListeners,
            mockErrorCallback,
        }) => {
            const mockDisconnectListener = vi.fn();
            gl.onDisconnect(mockDisconnectListener);

            expect(messageListeners[0]).not.toBeNull();

            const mockGuideBuilderPort = createMockPort('gb-cyberguide', 234);
            messageListeners[0](mockGuideBuilderPort);

            expect(mockErrorCallback).not.toHaveBeenCalled();

            const sendMockDisconnect = mockGuideBuilderPort
                .onDisconnect.addListener.mock.calls[0][0];
            sendMockDisconnect();

            expect(mockDisconnectListener).toHaveBeenCalled();
        });

    });

    describe('sendToPort', () => {

        it('sends a message to the correct port', () => {
            const gl = new GlobalListener();

            const mockPort = createMockPort('test', 123);
            gl._ports.set('test-123', {
                name: 'test-123',
                channelName: 'test',
                tabId: '123',
                runtimePort: mockPort,
            });

            const mockMessage = { type: 'test', data: 'test data' };
            gl.sendToPort('test-123', mockMessage);

            expect(mockPort.postMessage).toHaveBeenCalled();
            expect(mockPort.postMessage.mock.calls[0][0])
                .toEqual(mockMessage);
        });

        it('returns an error if the port does not exist', () => {
            const gl = new GlobalListener();

            const mockMessage = { type: 'test', data: 'test data' };
            const result = gl.sendToPort('test-123', mockMessage);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error?.message).toBe('No port found');
            }
        });
    });

    describe('sendToChannel', () => {

        it('sends a message to all ports in the channel', () => {
            const gl = new GlobalListener();

            const mockPort1 = {
                name: 'test1',
                runtimePort: createMockPort('test1', 123),
                channelName: 'testChannel',
                tabId: '123',
            };
            const mockPort2 = {
                name: 'test2',
                runtimePort: createMockPort('test2', 123),
                channelName: 'testChannel',
                tabId: '123',
            };
            const mockPort3 = {
                name: 'test3',
                runtimePort: createMockPort('test3', 123),
                channelName: 'testChannel',
                tabId: '123',
            };

            const ports = new Set([mockPort1, mockPort2, mockPort3]);

            gl._channel_ports.set('testChannel', ports);

            const mockMessage = { type: 'test', data: 'test data' };
            gl.sendToChannel('testChannel', mockMessage);

            expect(mockPort1.runtimePort.postMessage).toHaveBeenCalled();
            expect(mockPort1.runtimePort.postMessage.mock.calls[0][0])
                .toEqual(mockMessage);

            expect(mockPort2.runtimePort.postMessage).toHaveBeenCalled();
            expect(mockPort2.runtimePort.postMessage.mock.calls[0][0])
                .toEqual(mockMessage);

            expect(mockPort3.runtimePort.postMessage).toHaveBeenCalled();
            expect(mockPort3.runtimePort.postMessage.mock.calls[0][0])
                .toEqual(mockMessage);
        });

        it('does not send a message to the one specified', () => {
            const gl = new GlobalListener();

            const mockPort1 = {
                name: 'test1',
                runtimePort: createMockPort('test1', 123),
                channelName: 'testChannel',
                tabId: '123',
            };
            const mockPort2 = {
                name: 'test2',
                runtimePort: createMockPort('test2', 234),
                channelName: 'testChannel',
                tabId: '234',
            };
            const mockPort3 = {
                name: 'test3',
                runtimePort: createMockPort('test3', 345),
                channelName: 'testChannel',
                tabId: '345',
            };

            const ports = new Set([mockPort1, mockPort2, mockPort3]);

            gl._channel_ports.set('testChannel', ports);

            const mockMessage = { type: 'test', data: 'test data' };
            gl.sendToChannel('testChannel', mockMessage, '234');

            expect(mockPort1.runtimePort.postMessage).toHaveBeenCalled();
            expect(mockPort1.runtimePort.postMessage.mock.calls[0][0])
                .toEqual(mockMessage);

            expect(mockPort2.runtimePort.postMessage).not.toHaveBeenCalled();

            expect(mockPort3.runtimePort.postMessage).toHaveBeenCalled();
            expect(mockPort3.runtimePort.postMessage.mock.calls[0][0])
                .toEqual(mockMessage);
        });

        it('returns an error if the channel does not exist', () => {
            const gl = new GlobalListener();

            const mockPort = {
                name: 'test1',
                runtimePort: createMockPort('test1', 123),
                channelName: 'testChannel',
                tabId: '123',
            };

            const ports = new Set([mockPort]);

            gl._channel_ports.set('testChannel', ports);

            const mockMessage = { type: 'test', data: 'test data' };
            const result = gl.sendToChannel('invalidChannel', mockMessage);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error?.message).toBe('No channel found');
            }
        });
    });

    describe('sendToTab', () => {
        it('sends a message to all ports in the tab', () => {
            const gl = new GlobalListener();

            const mockPort1 = {
                name: 'test1',
                runtimePort: createMockPort('test1', 123),
                channelName: 'testChannel1',
                tabId: '123',
            };
            const mockPort2 = {
                name: 'test2',
                runtimePort: createMockPort('test2', 123),
                channelName: 'testChannel2',
                tabId: '123',
            };
            const mockPort3 = {
                name: 'test3',
                runtimePort: createMockPort('test3', 123),
                channelName: 'testChannel3',
                tabId: '123',
            };

            const ports = new Set([mockPort1, mockPort2, mockPort3]);

            gl._tab_ports.set('123', ports);

            const mockMessage = { type: 'test', data: 'test data' };
            gl.sendToTab('123', mockMessage);

            expect(mockPort1.runtimePort.postMessage).toHaveBeenCalled();
            expect(mockPort1.runtimePort.postMessage.mock.calls[0][0])
                .toEqual(mockMessage);

            expect(mockPort2.runtimePort.postMessage).toHaveBeenCalled();
            expect(mockPort2.runtimePort.postMessage.mock.calls[0][0])
                .toEqual(mockMessage);

            expect(mockPort3.runtimePort.postMessage).toHaveBeenCalled();
            expect(mockPort3.runtimePort.postMessage.mock.calls[0][0])
                .toEqual(mockMessage);
        });

        it('does not send a message to the one specified', () => {
            const gl = new GlobalListener();

            const mockPort1 = {
                name: 'test1',
                runtimePort: createMockPort('test1', 123),
                channelName: 'testChannel1',
                tabId: '123',
            };
            const mockPort2 = {
                name: 'test2',
                runtimePort: createMockPort('test2', 123),
                channelName: 'testChannel2',
                tabId: '123',
            };
            const mockPort3 = {
                name: 'test3',
                runtimePort: createMockPort('test3', 123),
                channelName: 'testChannel3',
                tabId: '123',
            };

            const ports = new Set([mockPort1, mockPort2, mockPort3]);

            gl._tab_ports.set('123', ports);

            const mockMessage = { type: 'test', data: 'test data' };
            gl.sendToTab('123', mockMessage, 'testChannel2');

            expect(mockPort1.runtimePort.postMessage).toHaveBeenCalled();
            expect(mockPort1.runtimePort.postMessage.mock.calls[0][0])
                .toEqual(mockMessage);

            expect(mockPort2.runtimePort.postMessage).not.toHaveBeenCalled();

            expect(mockPort3.runtimePort.postMessage).toHaveBeenCalled();
            expect(mockPort3.runtimePort.postMessage.mock.calls[0][0])
                .toEqual(mockMessage);
        });

        it('returns an error if the tab does not exist', () => {
            const gl = new GlobalListener();

            const mockPort = {
                name: 'test1',
                runtimePort: createMockPort('test1', 123),
                channelName: 'testChannel',
                tabId: '123',
            };

            const ports = new Set([mockPort]);

            gl._tab_ports.set('123', ports);

            const mockMessage = { type: 'test', data: 'test data' };
            const result = gl.sendToTab('invalidTab', mockMessage);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error?.message).toBe('No tab found');
            }
        });
    });
});
