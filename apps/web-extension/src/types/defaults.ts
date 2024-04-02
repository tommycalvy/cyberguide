import { 
    GlobalState, 
    TabState,
    GlobalClick,
} from './state';

export const defaultGlobalClicks: GlobalClick[] = [];
export const defaultGlobalRecording: boolean = false;

export const defaultGlobalState: GlobalState = {
    recording: defaultGlobalRecording,
    clicks: defaultGlobalClicks,
};

export const defaultTabPreviewing: boolean = false;
export const defaultTabCurrentStep: number = 0;

export const defaultTabState: TabState = {
    previewing: defaultTabPreviewing,
    currentStep: defaultTabCurrentStep,
};
