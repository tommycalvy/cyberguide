import { 
    GlobalState, 
    TabState,
    GuideBuilderState,
    SidebarProviderState,
    GuideBuilderProviderState,
    Cache,
    GuideBuilderInstance,
    SidebarInstance,
} from './state';
import { PortName } from '../types/messaging';
import { TabId } from '../types/extra';

export const defaultGlobalState: GlobalState = {
    recording: false,
    actions: [],
};

export const defaultTabState: TabState = {
    previewing: false,
};

export const defaultGuideBuilderState: GuideBuilderState = {
    currentStep: 0,
};

export const defaultSidebarProviderState: SidebarProviderState = {
    global: defaultGlobalState,
    tab: defaultTabState,
};

export const defaultGuideBuilderProviderState: GuideBuilderProviderState = {
    global: defaultGlobalState,
    tab: defaultTabState,
    local: defaultGuideBuilderState,
};

export const defaultCache: Cache = {
    globalState: defaultGlobalState,
    tabStates: new Map<TabId,TabState>(),
    guideBuilderInstances: new Map<TabId,GuideBuilderInstance>(),
    sidebarInstances: new Map<TabId,SidebarInstance>(),
    portNameToTabId: new Map<PortName,TabId>(),
};
