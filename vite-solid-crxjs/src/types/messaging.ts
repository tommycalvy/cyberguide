import browser from 'webextension-polyfill';

export type TabId = number;

export type PortName = string;

export type MessageType = string;

export interface Message {
    type: MessageType;
    data?: any;
}

export type MessageListener = (
    port: browser.Runtime.Port,
    msg: Message,
    tabId: TabId,
) => void;

export type GlobalListener = (
    port: browser.Runtime.Port,
    msg: Message,
    tabId: TabId,
    channelName: ChannelName,
) => void;

export type PortListener = (port: browser.Runtime.Port, tabId: TabId) => void;
export type Failure = (err: Error) => void;

export interface MessagingPort {
    port: browser.Runtime.Port;
    tabId: TabId;
}


export type ChannelName = string;

export interface PortDescriptor {
    channelName: ChannelName;
    tabId: TabId;
};

export interface MessagingChannel {
    name: ChannelName;
    ports: Map<TabId, MessagingPort>;
    messageListeners: Map<ChannelName, MessageListener>;
    disconnectListener: PortListener | null;
    connectListener: PortListener | null;
}
