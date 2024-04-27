import browser from 'webextension-polyfill';

export type Browser = typeof browser;

export type RuntimePort = browser.Runtime.Port;

export type TabId = string;

export type ChannelName = string;

export type PortName = string;

export type MessageType = string;

export interface Port {
    name: PortName;
    runtimePort: RuntimePort;
    channelName: ChannelName;
    tabId: TabId;
}

export interface Message {
    type: MessageType;
    data?: any;
}

export type ConnectListener = (port: Port) => void;
export type DisconnectListener = (port: Port) => void;
export type MessageListener = (message: Message, port: Port) => void;

