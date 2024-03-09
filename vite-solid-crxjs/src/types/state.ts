import type { TabId, PortName } from '../types/messaging';
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
    portName: PortName;
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
