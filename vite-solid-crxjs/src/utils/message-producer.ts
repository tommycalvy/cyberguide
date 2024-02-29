import browser from 'webextension-polyfill';
import { Message } from './types';
import type { Setter } from 'solid-js';

class Port {

    #channel: string;
    #randStrLen: number;
    #name: string;
    #bport: browser.Runtime.Port | null;
    #listeners: Map<string, (msg: Message) => void>;
    #setReconnectionAttempts: Setter<number>;

    constructor(channel: string, setReconnectionAttempts: Setter<number>, randStrLen: number = 11) {
        // If channel is not 2 characters long, throw an error
        if (channel.length !== 2) {
            throw new Error('Channel must be 2 characters long');
        }
        this.#channel = channel;
        this.#setReconnectionAttempts = setReconnectionAttempts;
        this.#randStrLen = randStrLen;
        this.#name = this.generateNewName();
        this.#bport = null;
        this.#listeners = new Map();
        this.connect(); 
    }

    generateNewName(): string {
        return this.#channel + '-' + this.randomString(this.#randStrLen);
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
        this.#bport = browser.runtime.connect({ name: this.#name });
        this.#bport.onMessage.addListener((msg) => {
            console.log(this.#name, 'received message:', msg);
            const listener = this.#listeners.get(msg.type);
            if (listener) {
                listener(msg);
            } else {
                console.warn('No listener for message type:', msg.type);
            }
        });
        this.#bport.onDisconnect.addListener(() => {
            console.log(this.#name, 'disconnected');
            this.reconnect();
        });
    }

    disconnect(): void {
        if (this.#bport) {
            this.#bport.disconnect();
            this.#bport = null; // Ensure the old port is cleared
        }
    }

    reconnect(): void {
        console.log(this.#name, 'reconnecting');
        this.disconnect(); // Disconnect the current port
        this.#setReconnectionAttempts((prev: number) => prev + 1);
        this.#name = this.generateNewName(); // Generate a new ID
        this.connect(); // Reconnect with the new ID
    }

    // Method to add message listeners
    setListener(messageType: string, callback: (msg: Message) => void): void {
        this.#listeners.set(messageType, callback);
    }

    // Method to remove message listeners if needed
    removeListener(messageType: string): boolean {
        return this.#listeners.delete(messageType);
    }

    // Method to send message
    send(msg: Message): void {
        if (this.#bport) {
            this.#bport.postMessage(msg);
        } else {
            console.error('Port is not connected');
        }
    }
}

export default Port;
