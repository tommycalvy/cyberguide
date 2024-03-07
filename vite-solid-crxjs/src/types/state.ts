import type { TabId } from '../types/extra';
import type { PortName } from '../types/messaging';
import { Channel } from '../utils/channel';
import type { Accessor } from 'solid-js';

export interface GlobalClick {
    url: string;
    elt: Element;
};

export interface GlobalState {
    recording: boolean;
    clicks: GlobalClick[];
};

interface GlobalStateAccessors {
    globalRecording: Accessor<boolean>;
    globalClicks: Accessor<GlobalClick[]>;
};

export interface TabState {
    previewing: boolean;
    currentStep: number;
};

interface TabStateAccessors {
    tabPreviewing: Accessor<boolean>;
    tabCurrentStep: Accessor<number>;
};

export interface SidebarStateAccessors {
    global: GlobalStateAccessors;
    tab: TabStateAccessors;
};

export interface GuideBuilderStateAccessors {
    global: GlobalStateAccessors;
    tab: TabStateAccessors;
};

export interface Instance {
    connected: boolean;
};

export interface GuideBuilderInstance extends Instance {};

export interface SidebarInstance extends Instance {};

export interface StoredCache {
    globalState: GlobalState;
    tabStates: [TabId, TabState][];
    guideBuilders: [PortName, GuideBuilderInstance][];
    sidebars: [PortName, SidebarInstance][];
};

export interface Cache {
    globalState: GlobalState;
    tabId_to_tabState: Map<TabId, TabState>;
    portName_to_guideBuilderInstance: Map<PortName, GuideBuilderInstance>;
    portName_to_sidebarInstance: Map<PortName, SidebarInstance>;
};
