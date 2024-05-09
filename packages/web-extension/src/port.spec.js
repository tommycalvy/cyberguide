import { describe, expect, it, vi } from 'vitest';
import { Port } from './port.js';
import { createMockPort } from './create-mock-port.js';

describe('Port', () => {
    it('initializes correctly when tabId is specified', () => {
        const channelName = 'test';
        const setReconnectAttempts = vi.fn();
        const tabId = '123';
        const logging = true;

        const port = new Port({ 
            channelName,
            setReconnectAttempts,
            tabId,
            logging 
        });

        expect(port._channelName).toBe(channelName);
        expect(port._setReconnectAttempts).toBe(setReconnectAttempts);
        expect(port._tabId).toBe(tabId);
        expect(port._logging).toBe(logging);
        expect(port._portName).toBe(channelName + '-' + tabId);
        expect(port._backgroundPort).toBeNull();
        expect(port._messageListeners.size).toBe(0);
    });

    it('initializes correctly when tabId is not specified', () => {
        const channelName = 'test';
        const setReconnectAttempts = vi.fn();
        const logging = true;

        const port = new Port({ 
            channelName,
            setReconnectAttempts,
            logging 
        });

        expect(port._channelName).toBe(channelName);
        expect(port._setReconnectAttempts).toBe(setReconnectAttempts);
        expect(port._tabId).toBe('cyberguide');
        expect(port._logging).toBe(logging);
        expect(port._portName).toBe(channelName + '-' + 'cyberguide');
        expect(port._backgroundPort).toBeNull();
        expect(port._messageListeners.size).toBe(0);
    });

    it('connects correctly to background listener', () => {
        const port = new Port({ 
            channelName: 'test',
            setReconnectAttempts: vi.fn(),
            logging: true, 
        });

        const runtimeConnect = vi.fn();
        const mockBackgroundPort = createMockPort('test', undefined);
        runtimeConnect.mockReturnValue(mockBackgroundPort);

        port.connect(runtimeConnect);

        expect(port._backgroundPort).toBe(mockBackgroundPort);
        expect(runtimeConnect).toHaveBeenCalledWith({ name: port._portName });
        if (port._backgroundPort) {
            expect(port._backgroundPort.onMessage.addListener)
                .toHaveBeenCalled();
        }
    });

    it('adds a specified message listener', () => {
        const port = new Port({ 
            channelName: 'test',
            setReconnectAttempts: vi.fn(),
            logging: true, 
        });

        const mockMessageType = 'testMessage';
        const mockListener = vi.fn();
        port.setMessageListener(mockMessageType, mockListener);

        expect(port._messageListeners.get(mockMessageType)).toBe(mockListener);
    });

    it('removes a specified message listener', () => {
        const port = new Port({ 
            channelName: 'test',
            setReconnectAttempts: vi.fn(),
            logging: true, 
        });

        const mockMessageType = 'testMessage';
        const mockListener = vi.fn();
        port.setMessageListener(mockMessageType, mockListener);

        expect(port._messageListeners.get(mockMessageType)).toBe(mockListener);

        port.removeMessageListener(mockMessageType);

        expect(port._messageListeners.get(mockMessageType)).toBeUndefined();
    });

    it('fails to remove a message listener that does not exist', () => {
        const port = new Port({ 
            channelName: 'test',
            setReconnectAttempts: vi.fn(),
            logging: true, 
        });

        const mockMessageType = 'testMessage';
        const mockListener = vi.fn();
        port.setMessageListener(mockMessageType, mockListener);

        expect(port._messageListeners.get(mockMessageType)).toBe(mockListener);

        const result = port.removeMessageListener('nonExistentMessageType');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error?.message).toBe('No listener for message type');
        }

        expect(port._messageListeners.get(mockMessageType)).toBe(mockListener);
    });

    it('calls a specified message listener when a message is received', () => {
        const channelName = 'testChannel';
        const tabId = '123';
        const port = new Port({ 
            channelName,
            setReconnectAttempts: vi.fn(),
            tabId,
            logging: true, 
        });

        const mockMessageType = 'testMessage';
        const mockMessageListener = vi.fn();
        port.setMessageListener(mockMessageType, mockMessageListener);

        const mockMessage = { type: mockMessageType, data: 'test data' };
        const runtimeConnect = vi.fn();
        const mockBackgroundPort = createMockPort('test', undefined);
        runtimeConnect.mockReturnValue(mockBackgroundPort);

        port.connect(runtimeConnect);

        const sendMockMessage = mockBackgroundPort
            .onMessage.addListener.mock.calls[0][0];
        sendMockMessage(mockMessage, mockBackgroundPort);

        expect(mockMessageListener).toHaveBeenCalledWith(mockMessage, {
            name: port._portName,
            runtimePort: mockBackgroundPort,
            channelName,
            tabId,
        });
    });

    it('disconnects correctly when disconnect() is called', () => {
        const port = new Port({ 
            channelName: 'testChannel',
            setReconnectAttempts: vi.fn(),
            logging: true, 
        });

        const runtimeConnect = vi.fn();
        const mockBackgroundPort = createMockPort('test', undefined);
        runtimeConnect.mockReturnValue(mockBackgroundPort);

        port.connect(runtimeConnect);

        port.disconnect();

        expect(mockBackgroundPort.disconnect).toHaveBeenCalled();
        expect(port._backgroundPort).toBeNull();
    });

    it('reconnects correctly when already disconnected', () => {
        const mockSetReconnectAttempts = vi.fn();
        const port = new Port({ 
            channelName: 'testChannel',
            setReconnectAttempts: mockSetReconnectAttempts,
            logging: true, 
        });

        const runtimeConnect = vi.fn();
        const mockBackgroundPort = createMockPort('test', undefined);
        runtimeConnect.mockReturnValue(mockBackgroundPort);

        port.connect(runtimeConnect);
        port.disconnect();
        port.reconnect(runtimeConnect);

        expect(mockSetReconnectAttempts).toHaveBeenCalled();
        expect(runtimeConnect).toHaveBeenCalledTimes(2);
    });

    it('attempts to reconnect when disconnected', () => {
        const mockSetReconnectAttempts = vi.fn();
        const port = new Port({ 
            channelName: 'testChannel',
            setReconnectAttempts: mockSetReconnectAttempts,
            logging: true, 
        });

        const runtimeConnect = vi.fn();
        const mockBackgroundPort = createMockPort('test', undefined);
        runtimeConnect.mockReturnValue(mockBackgroundPort);

        port.connect(runtimeConnect);

        const sendMockDisconnect = mockBackgroundPort
            .onDisconnect.addListener.mock.calls[0][0];
        sendMockDisconnect();

        expect(mockSetReconnectAttempts).toHaveBeenCalled();
        expect(runtimeConnect).toHaveBeenCalledTimes(2);
    });

    it('can send a message with send()', () => {
        const port = new Port({ 
            channelName: 'testChannel',
            setReconnectAttempts: vi.fn(),
            logging: true, 
        });

        const runtimeConnect = vi.fn();
        const mockBackgroundPort = createMockPort('test', undefined);
        runtimeConnect.mockReturnValue(mockBackgroundPort);

        port.connect(runtimeConnect);

        const mockMessage = { type: 'test', data: 'test data' };
        port.send(mockMessage);

        expect(mockBackgroundPort.postMessage)
            .toHaveBeenCalledWith(mockMessage);
    });

    it('fails to send a message when not connected', () => {
        const port = new Port({ 
            channelName: 'testChannel',
            setReconnectAttempts: vi.fn(),
            logging: true, 
        });

        const runtimeConnect = vi.fn();
        const mockBackgroundPort = createMockPort('test', undefined);
        runtimeConnect.mockReturnValue(mockBackgroundPort);

        port.connect(runtimeConnect);
        port.disconnect();

        const mockMessage = { type: 'test', data: 'test data' };
        const result = port.send(mockMessage);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error?.message).toBe('Port is not connected');
        }
    });
});
