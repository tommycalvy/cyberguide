export type TabId = string;

export type ChannelName = string;

export type PortName = string;

export type MessageType = string;

export interface Message {
    type: MessageType;
    data?: any;
}

