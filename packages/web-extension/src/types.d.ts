import type { Runtime, runtime } from '@types/webextension-polyfill';
import type { Setter } from 'solid-js';

const onConnect = runtime.onConnect;
export type OnConnect = typeof onConnect;

const runtimeConnect = runtime.connect;
export type RuntimeConnect = typeof runtimeConnect;

export type RuntimePort = Runtime.Port;

export type NumberSetter = Setter<number>;

export type Callback = (port: RuntimePort) => void;

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

