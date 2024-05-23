import { describe, expect, it, vi } from 'vitest';
import { Channel } from './channel';
import { createMockPort } from './create-mock-port';

describe('Channel', () => {
    it('initializes correctly when tabId is specified', () => {
        const channelName = 'test';
        const setReconnectAttempts = vi.fn();
        const tabId = '123';
        const logging = true;

        const channel = new Channel({ 
            channelName,
            setReconnectAttempts,
            tabId,
            logging 
        });

        expect(channel._channelName).toBe(channelName);
        expect(channel._setReconnectAttempts).toBe(setReconnectAttempts);
        expect(channel._tabId).toBe(tabId);
        expect(channel._logging).toBe(logging);
        expect(channel._portName).toBe(channelName + '-' + tabId);
        expect(channel._backgroundPort).toBeNull();
        expect(channel._messageListeners.size).toBe(0);
    });

    it('initializes correctly when tabId is not specified', () => {
        const channelName = 'test';
        const setReconnectAttempts = vi.fn();
        const logging = true;

        const channel = new Channel({ 
            channelName,
            setReconnectAttempts,
            logging 
        });

        expect(channel._channelName).toBe(channelName);
        expect(channel._setReconnectAttempts).toBe(setReconnectAttempts);
        expect(channel._tabId).toBe('cyberguide');
        expect(channel._logging).toBe(logging);
        expect(channel._portName).toBe(channelName + '-' + 'cyberguide');
        expect(channel._backgroundPort).toBeNull();
        expect(channel._messageListeners.size).toBe(0);
    });

    it('connects correctly to background listener', () => {
        const channel = new Channel({ 
            channelName: 'test',
            setReconnectAttempts: vi.fn(),
            logging: true, 
        });

        const runtimeConnect = vi.fn();
        const mockBackgroundPort = createMockPort('test', undefined);
        runtimeConnect.mockReturnValue(mockBackgroundPort);

        channel.connect(runtimeConnect);

        expect(channel._backgroundPort).toBe(mockBackgroundPort);
        expect(runtimeConnect).toHaveBeenCalledWith({ 
            name: channel._portName 
        });
        if (channel._backgroundPort) {
            expect(channel._backgroundPort.onMessage.addListener)
                .toHaveBeenCalled();
        }
    });

    it('adds a specified message listener', () => {
        const channel = new Channel({ 
            channelName: 'test',
            setReconnectAttempts: vi.fn(),
            logging: true, 
        });

        const mockMessageType = 'testMessage';
        const mockListener = vi.fn();
        channel.setMessageListener(mockMessageType, mockListener);

        const messageListener = channel._messageListeners.get(mockMessageType);
        expect(messageListener).toBe(mockListener);
    });

    it('removes a specified message listener', () => {
        const channel = new Channel({ 
            channelName: 'test',
            setReconnectAttempts: vi.fn(),
            logging: true, 
        });

        const mockMessageType = 'testMessage';
        const mockListener = vi.fn();
        channel.setMessageListener(mockMessageType, mockListener);

        const messageListener = channel._messageListeners.get(mockMessageType);
        expect(messageListener).toBe(mockListener);

        channel.removeMessageListener(mockMessageType);

        expect(channel._messageListeners.get(mockMessageType)).toBeUndefined();
    });

    it('fails to remove a message listener that does not exist', () => {
        const channel = new Channel({ 
            channelName: 'test',
            setReconnectAttempts: vi.fn(),
            logging: true, 
        });

        const mockMessageType = 'testMessage';
        const mockListener = vi.fn();
        channel.setMessageListener(mockMessageType, mockListener);

        expect(channel._messageListeners.get(mockMessageType))
            .toBe(mockListener);

        const result = channel.removeMessageListener('nonExistentMessageType');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error?.message).toBe('No listener for message type');
        }

        expect(channel._messageListeners.get(mockMessageType))
            .toBe(mockListener);
    });

    it('calls a specified message listener when a message is received', () => {
        const channelName = 'testChannel';
        const tabId = '123';
        const channel = new Channel({ 
            channelName,
            setReconnectAttempts: vi.fn(),
            tabId,
            logging: true, 
        });

        const mockMessageType = 'testMessage';
        const mockMessageListener = vi.fn();
        channel.setMessageListener(mockMessageType, mockMessageListener);

        const mockMessage = { type: mockMessageType, data: 'test data' };
        const runtimeConnect = vi.fn();
        const mockBackgroundPort = createMockPort('test', undefined);
        runtimeConnect.mockReturnValue(mockBackgroundPort);

        channel.connect(runtimeConnect);

        const sendMockMessage = mockBackgroundPort
            .onMessage.addListener.mock.calls[0][0];
        sendMockMessage(mockMessage, mockBackgroundPort);

        expect(mockMessageListener).toHaveBeenCalledWith(mockMessage, {
            name: channel._portName,
            runtimePort: mockBackgroundPort,
            channelName,
            tabId,
        });
    });

    it('disconnects correctly when disconnect() is called', () => {
        const channel = new Channel({ 
            channelName: 'testChannel',
            setReconnectAttempts: vi.fn(),
            logging: true, 
        });

        const runtimeConnect = vi.fn();
        const mockBackgroundPort = createMockPort('test', undefined);
        runtimeConnect.mockReturnValue(mockBackgroundPort);

        channel.connect(runtimeConnect);

        channel.disconnect();

        expect(mockBackgroundPort.disconnect).toHaveBeenCalled();
        expect(channel._backgroundPort).toBeNull();
    });

    it('reconnects correctly when already disconnected', () => {
        const mockSetReconnectAttempts = vi.fn();
        const channel = new Channel({ 
            channelName: 'testChannel',
            setReconnectAttempts: mockSetReconnectAttempts,
            logging: true, 
        });

        const runtimeConnect = vi.fn();
        const mockBackgroundPort = createMockPort('test', undefined);
        runtimeConnect.mockReturnValue(mockBackgroundPort);

        channel.connect(runtimeConnect);
        channel.disconnect();
        channel.reconnect(runtimeConnect);

        expect(mockSetReconnectAttempts).toHaveBeenCalled();
        expect(runtimeConnect).toHaveBeenCalledTimes(2);
    });

    it('attempts to reconnect when disconnected', () => {
        const mockSetReconnectAttempts = vi.fn();
        const channel = new Channel({ 
            channelName: 'testChannel',
            setReconnectAttempts: mockSetReconnectAttempts,
            logging: true, 
        });

        const runtimeConnect = vi.fn();
        const mockBackgroundPort = createMockPort('test', undefined);
        runtimeConnect.mockReturnValue(mockBackgroundPort);

        channel.connect(runtimeConnect);

        const sendMockDisconnect = mockBackgroundPort
            .onDisconnect.addListener.mock.calls[0][0];
        sendMockDisconnect();

        expect(mockSetReconnectAttempts).toHaveBeenCalled();
        expect(runtimeConnect).toHaveBeenCalledTimes(2);
    });

    it('can send a message with send()', () => {
        const channel = new Channel({ 
            channelName: 'testChannel',
            setReconnectAttempts: vi.fn(),
            logging: true, 
        });

        const runtimeConnect = vi.fn();
        const mockBackgroundPort = createMockPort('test', undefined);
        runtimeConnect.mockReturnValue(mockBackgroundPort);

        channel.connect(runtimeConnect);

        const mockMessage = { type: 'test', data: 'test data' };
        channel.send(mockMessage);

        expect(mockBackgroundPort.postMessage)
            .toHaveBeenCalledWith(mockMessage);
    });

    it('fails to send a message when not connected', () => {
        const channel = new Channel({ 
            channelName: 'testChannel',
            setReconnectAttempts: vi.fn(),
            logging: true, 
        });

        const runtimeConnect = vi.fn();
        const mockBackgroundPort = createMockPort('test', undefined);
        runtimeConnect.mockReturnValue(mockBackgroundPort);

        channel.connect(runtimeConnect);
        channel.disconnect();

        const mockMessage = { type: 'test', data: 'test data' };
        const result = channel.send(mockMessage);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error?.message).toBe('Port is not connected');
        }
    });
});
