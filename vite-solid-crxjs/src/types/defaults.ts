import { 
    GlobalState, 
    TabState,
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
    currentStep: 0,
};

export const defaultSidebarProviderState: SidebarProviderState = {
    global: defaultGlobalState,
    tab: defaultTabState,
};

export const defaultGuideBuilderProviderState: GuideBuilderProviderState = {
    global: defaultGlobalState,
    tab: defaultTabState,
};

export const defaultCache: Cache = {
    globalState: defaultGlobalState,
    tabId_to_tabState: new Map<TabId,TabState>(),
    tabId_to_guideBuilderInstance: new Map<TabId,GuideBuilderInstance>(),
    tabId_to_sidebarInstance: new Map<TabId,SidebarInstance>(),
    portName_to_tabId: new Map<PortName,TabId>(),
};
