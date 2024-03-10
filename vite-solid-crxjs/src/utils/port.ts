import browser from 'webextension-polyfill';
import type { Message, MessageType } from '../types/messaging';
import type { Setter } from 'solid-js';

class Port {

    channelName: string;
    portName: string | null;
    tabId: string | null;
    backgroundPort: browser.Runtime.Port | null;
    messageListeners: Map<MessageType, (msg: Message) => void>;
    setReconnectionAttempts: Setter<number>;

    constructor(
        channelName: string,
        setReconnectionAttempts: Setter<number>,
        tabId?: string,
    ) {
        // If channel is not 2 characters long, throw an error
        if (channelName.length !== 2) {
            throw new Error('Channel must be 2 characters long');
        }
        this.channelName = channelName;
        this.setReconnectionAttempts = setReconnectionAttempts;
        this.tabId = null;
        this.portName = null;
        if (tabId) {
            this.tabId = tabId;
            this.portName = this.channelName + '-' + tabId;
        }
        this.backgroundPort = null;
        this.messageListeners = new Map();
        this.connect(); 
    }

    connect() {
        if (this.portName === null) {
            this.portName = this.channelName + '-cyberguide';
        }
        this.backgroundPort = browser.runtime.connect({ name: this.portName });
        this.backgroundPort.onMessage.addListener((msg) => {
            console.log(this.portName, 'received message:', msg);
            const messageListener = this.messageListeners.get(msg.type);
            if (messageListener) {
                messageListener(msg);
            } else {
                throw new Error('No listener for message type:', msg.type);
            }
        });
        this.backgroundPort.onDisconnect.addListener(() => {
            console.log(this.portName, 'disconnected');
            this.reconnect();
        });
    }

    disconnect(): void {
        if (this.backgroundPort) {
            this.backgroundPort.disconnect();
            this.backgroundPort = null; // Ensure the old port is cleared
        }
    }

    reconnect(): void {
        console.log(this.portName, 'reconnecting');
        this.disconnect(); // Disconnect the current port
        this.setReconnectionAttempts((prev: number) => prev + 1);
        this.connect(); // Reconnect with the new ID
    }

    setMessageListener(
        messageType: MessageType,
        messageListener: (msg: Message) => void,
    ) {
        this.messageListeners.set(messageType, messageListener);
    }

    removeMessageListener(messageType: MessageType): Error | null {
        const removed = this.messageListeners.delete(messageType);
        if (removed) {
            return null;
        }
        return new Error('No listener for message type: ' + messageType);
    }

    send(msg: Message): Error | null {
        if (this.backgroundPort) {
            this.backgroundPort.postMessage(msg);
            return null;
        }
        return new Error('Port is not connected');
    }
}

export default Port;
