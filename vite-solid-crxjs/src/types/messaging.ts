import browser from 'webextension-polyfill';

export type MessageType = string;

export interface Message {
    type: MessageType;
    message?: string;
    data?: any;
    key?: any[];
    value?: any;
}

export type MessageListener = (port: browser.Runtime.Port, msg: Message) => void;
export type PortListener = (port: browser.Runtime.Port) => void;
export type Failure = (err: Error) => void;

export type PortName = string;

export interface MessagingPort {
    port: browser.Runtime.Port;
    name: PortName;
}

export type ChannelName = string;

export interface MessagingChannel {
    ports: Map<PortName, MessagingPort>;
    messageListeners: Map<ChannelName, MessageListener>;
    disconnectListener: PortListener | null;
    connectListener: PortListener | null;
}
