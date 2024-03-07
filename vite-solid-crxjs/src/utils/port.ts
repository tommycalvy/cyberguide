import browser from 'webextension-polyfill';
import type { Message, MessageType } from '../types/messaging';
import type { Setter } from 'solid-js';

class Port {

    channelName: string;
    portName: string | null;
    backgroundPort: browser.Runtime.Port | null;
    messageListeners: Map<MessageType, (msg: Message) => void>;
    setReconnectionAttempts: Setter<number>;

    constructor(
        channelName: string,
        setReconnectionAttempts: Setter<number>,
    ) {
        // If channel is not 2 characters long, throw an error
        if (channelName.length !== 2) {
            throw new Error('Channel must be 2 characters long');
        }
        this.channelName = channelName;
        this.setReconnectionAttempts = setReconnectionAttempts;
        this.portName = null;
        this.backgroundPort = null;
        this.messageListeners = new Map();
        this.connect(); 
    }

    async generatePortName(): Promise<string> {
        const queryOptions = { active: true, lastFocusedWindow: true };
        const tab = await browser.tabs.query(queryOptions);
        const tabId = tab[0].id;
        if (!tabId) {
            throw new Error('No active tab. Cannot generate port name');
        }
        return this.channelName + '-' + tabId;
    }

    async connect() {
        const portName = await this.generatePortName();
        this.portName = portName;
        this.backgroundPort = browser.runtime.connect({ name: portName });
        this.backgroundPort.onMessage.addListener((msg) => {
            console.log(portName, 'received message:', msg);
            const messageListener = this.messageListeners.get(msg.type);
            if (messageListener) {
                messageListener(msg);
            } else {
                console.warn('No listener for message type:', msg.type);
            }
        });
        this.backgroundPort.onDisconnect.addListener(() => {
            console.log(portName, 'disconnected');
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

    removeMessageListener(messageType: MessageType): boolean {
        return this.messageListeners.delete(messageType);
    }

    send(msg: Message): void {
        if (this.backgroundPort) {
            this.backgroundPort.postMessage(msg);
        } else {
            console.error('Port is not connected');
        }
    }
}

export default Port;
