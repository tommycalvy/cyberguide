import type { Action, TabId } from '../types/extra';
import type { PortName } from '../types/messaging';
import { Channel } from '../utils/channel';

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
    channel: Channel;
};

export interface GuideBuilderInstance extends Instance {};

export interface SidebarInstance extends Instance {};

export interface StoredCache {
    globalState: GlobalState;
    tabId_to_tabState: [TabId, TabState][];
    tabId_to_guideBuilderInstance: [TabId, GuideBuilderInstance][];
    tabId_to_sidebarInstance: [TabId, SidebarInstance][];
    portName_to_tabId: [PortName, TabId][];
};

export type TabId_To_GuideBuilderInstance = Map<TabId, GuideBuilderInstance>;
export type TabId_To_SidebarInstance = Map<TabId, SidebarInstance>;

export type TabId_To_Instance =
    TabId_To_GuideBuilderInstance | TabId_To_SidebarInstance;

export type PortName_To_TabId = Map<PortName, TabId>;

export interface Cache {
    globalState: GlobalState;
    tabId_to_tabState: Map<TabId, TabState>;
    tabId_to_guideBuilderInstance: TabId_To_GuideBuilderInstance;
    tabId_to_sidebarInstance: TabId_To_SidebarInstance;
    portName_to_tabId: PortName_To_TabId;
};
