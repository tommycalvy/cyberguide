import browser from 'webextension-polyfill';
import type { Message, MessageType } from '../types/messaging';
import type { Setter } from 'solid-js';

class Port {

    #channelName: string;
    #randStrLen: number;
    #name: string;
    #backgroundPort: browser.Runtime.Port | null;
    #messageListeners: Map<MessageType, (msg: Message) => void>;
    #setReconnectionAttempts: Setter<number>;

    constructor(
        channelName: string,
        setReconnectionAttempts: Setter<number>,
        randStrLen: number = 11,
    ) {
        // If channel is not 2 characters long, throw an error
        if (channelName.length !== 2) {
            throw new Error('Channel must be 2 characters long');
        }
        this.#channelName = channelName;
        this.#setReconnectionAttempts = setReconnectionAttempts;
        this.#randStrLen = randStrLen;
        this.#name = this.generateNewName();
        this.#backgroundPort = null;
        this.#messageListeners = new Map();
        this.connect(); 
    }

    generateNewName(): string {
        return this.#channelName + '-' + this.randomString(this.#randStrLen);
    }

    randomString(len: number) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < len; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    connect() {
        this.#backgroundPort = browser.runtime.connect({ name: this.#name });
        this.#backgroundPort.onMessage.addListener((msg) => {
            console.log(this.#name, 'received message:', msg);
            const messageListener = this.#messageListeners.get(msg.type);
            if (messageListener) {
                messageListener(msg);
            } else {
                console.warn('No listener for message type:', msg.type);
            }
        });
        this.#backgroundPort.onDisconnect.addListener(() => {
            console.log(this.#name, 'disconnected');
            this.reconnect();
        });
    }

    disconnect(): void {
        if (this.#backgroundPort) {
            this.#backgroundPort.disconnect();
            this.#backgroundPort = null; // Ensure the old port is cleared
        }
    }

    reconnect(): void {
        console.log(this.#name, 'reconnecting');
        this.disconnect(); // Disconnect the current port
        this.#setReconnectionAttempts((prev: number) => prev + 1);
        this.#name = this.generateNewName(); // Generate a new ID
        this.connect(); // Reconnect with the new ID
    }

    setMessageListener(
        messageType: MessageType,
        messageListener: (msg: Message) => void,
    ) {
        this.#messageListeners.set(messageType, messageListener);
    }

    removeMessageListener(messageType: MessageType): boolean {
        return this.#messageListeners.delete(messageType);
    }

    send(msg: Message): void {
        if (this.#backgroundPort) {
            this.#backgroundPort.postMessage(msg);
        } else {
            console.error('Port is not connected');
        }
    }
}

export default Port;
