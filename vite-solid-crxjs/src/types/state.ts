import type { TabId } from '../types/messaging';

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
};

export interface GuideBuilderInstance extends Instance {};

export interface SidebarInstance extends Instance {};

export interface StoredCache {
    globalState: GlobalState;
    tabStates: [TabId, TabState][];
    guideBuilders: [TabId, GuideBuilderInstance][];
    sidebars: [TabId, SidebarInstance][];
};
