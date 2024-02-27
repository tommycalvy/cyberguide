export interface Message {
    type: string;
    message?: string;
    data?: any;
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

export interface GuideCreatorState {
    shared: {
        previewing: boolean;
    };
    local:{
        currentStep: number;
    };
};

export interface SidebarState {
    shared: {
        previewing: boolean;
    };
};

export interface Instance {
    portName: string;
    tabId: number;
    connected: boolean;
};
