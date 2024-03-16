import type { TabId, PortName } from '../types/messaging';

export interface GlobalClick {
    url: string;
    elt: Element;
};

export interface GlobalState {
    recording: boolean;
    clicks: GlobalClick[];
};

export interface TabState {
    previewing: boolean;
    currentStep: number;
};

export interface Instance {
    connected: boolean;
    data?: any;
};

export interface StoredCache {
    globalState: GlobalState;
    tabIds: TabId[];
    portNames: PortName[];
};
