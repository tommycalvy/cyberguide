import type { Action, TabId } from '../types/extra';
import type { PortName } from '../types/messaging';

export interface GlobalState {
    recording: boolean;
    actions: Action[];
};

export interface TabState {
    previewing: boolean;
    currentStep: number;
};

export interface SidebarProviderState {
    global: GlobalState;
    tab: TabState;
}

export interface GuideBuilderProviderState {
    global: GlobalState;
    tab: TabState;
}

export interface Instance {
    portName: PortName;
    tabId: TabId;
    connected: boolean;
};

export interface GuideBuilderInstance extends Instance {};

export interface SidebarInstance extends Instance {};

export interface StoredCache {
    globalState: GlobalState;
    tabStates: [TabId, TabState][];
    guideBuilderInstances: [TabId, GuideBuilderInstance][];
    sidebarInstances: [TabId, SidebarInstance][];
    portNameToTabId: [PortName, TabId][];
};

export interface Cache {
    globalState: GlobalState;
    tabStates: Map<TabId, TabState>;
    guideBuilderInstances: Map<TabId, GuideBuilderInstance>;
    sidebarInstances: Map<TabId, SidebarInstance>;
    portNameToTabId: Map<PortName, TabId>;
};
