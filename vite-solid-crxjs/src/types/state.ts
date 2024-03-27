import type { TabId, PortName } from '../types/messaging';

export interface EltInfo {
    id: string | null;
    selector: string;
    classList: string[] | null;
    href: string | null;
    attributes: [string, string][];
};

export interface GlobalClick {
    location: string;
    eltInfo: EltInfo;
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
