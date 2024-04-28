import type { Runtime, runtime } from '@types/webextension-polyfill';

const onConnect = runtime.onConnect;

export type OnConnect = typeof onConnect;

export type TabId = string;

export type ChannelName = string;

export type PortName = string;

export type MessageType = string;

export interface Port {
    name: PortName;
    runtimePort: Runtime.Port;
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

