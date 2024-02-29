export interface Message {
    type: string;
    message?: string;
    data?: any;
    key?: any[];
    value?: any;
}

export interface StateChange extends Message {
    data: {
        key: any[];
        value: any;
    };
};


export interface Action {
    type: string;
    url: string;
    elt: Element;
};

export interface GlobalState {
    recording: boolean;
    actions: Action[];
};

export const defaultGlobalState: GlobalState = {
    recording: false,
    actions: [],
};

export interface SharedState {
    previewing: boolean;
};

export const defaultSharedState: SharedState = {
    previewing: false,
};

export interface SidebarState {
    theme: string;
};

export const defaultSidebarState: SidebarState = {
    theme: 'dark',
};

export interface GuideBuilderState {
    currentStep: number;
};

export const defaultGuideBuilderState: GuideBuilderState = {
    currentStep: 0,
};

export interface SidebarProviderState {
    global: GlobalState;
    shared: SharedState;
    local: SidebarState;
}

export const defaultSidebarProviderState: SidebarProviderState = {
    global: defaultGlobalState,
    shared: defaultSharedState,
    local: defaultSidebarState,
};

export interface GuideBuilderProviderState {
    global: GlobalState;
    shared: SharedState;
    local: GuideBuilderState;
}

export const defaultGuideBuilderProviderState: GuideBuilderProviderState = {
    global: defaultGlobalState,
    shared: defaultSharedState,
    local: defaultGuideBuilderState,
};

export interface Instance {
    portName: string;
    tabId: number;
    connected: boolean;
};

export type TabId = number;
