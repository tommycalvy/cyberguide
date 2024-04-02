import {
    createContext,
    useContext,
    createSignal,
    createEffect
} from 'solid-js';
import type { Accessor } from 'solid-js';
import Port from '../utils/port';
import type { GlobalClick } from '../types/state';
import {
    defaultGlobalRecording,
    defaultGlobalClicks,
    defaultTabPreviewing,
    defaultTabCurrentStep
} from '../types/defaults';
import useGlobalRecording from '../signals/global/recording';
import useGlobalClicks from '../signals/global/clicks';
import useTabPreviewing from '../signals/tab/previewing';
import useTabCurrentStep from '../signals/tab/current-step';

type SidebarContextValue = [
    state: {
        global: {
            globalRecording: Accessor<boolean>,
            globalClicks: Accessor<GlobalClick[]>,
        },
        tab: {
            tabPreviewing: Accessor<boolean>,
            tabCurrentStep: Accessor<number>,
        },
    },
    actions: {
        global: {
            startGlobalRecording: () => void,
            stopGlobalRecording: () => void,
        },
        tab: {
            startTabPreviewing: () => void,
            stopTabPreviewing: () => void,
        },
    },
];

const SidebarContext = createContext<SidebarContextValue>([
    {
        global: {
            globalRecording: () => defaultGlobalRecording,
            globalClicks: () => defaultGlobalClicks,
        },
        tab: {
            tabPreviewing: () => defaultTabPreviewing,
            tabCurrentStep: () => defaultTabCurrentStep,
        },
    },
    {
        global: {
            startGlobalRecording: () => undefined,
            stopGlobalRecording: () => undefined,
        },
        tab: {
            startTabPreviewing: () => undefined,
            stopTabPreviewing: () => undefined,
        },
    },
]);

export function SidebarProvider(props: { children: any }) {
    const [reconectionAttempts, setReconnectionAttempts] = createSignal(0);

    const tabId = location.search.split('tabId=')[1];
    if (!tabId) throw new Error('tabId not found');

    const backgroundPort = new Port('sb', setReconnectionAttempts, tabId);

    const {
        globalRecording,
        initGlobalRecording,
        startGlobalRecording,
        stopGlobalRecording,
    } = useGlobalRecording(backgroundPort);

    const {
        globalClicks,
        initGlobalClicks,
    } = useGlobalClicks(backgroundPort);

    const {
        tabPreviewing,
        initTabPreviewing,
        changeTabPreviewing,
    } = useTabPreviewing(backgroundPort);

    const {
        tabCurrentStep,
        initTabCurrentStep,
        resetTabCurrentStep,
    } = useTabCurrentStep(backgroundPort);

    function startTabPreviewing() {
        changeTabPreviewing(true);
    }

    function stopTabPreviewing() {
        changeTabPreviewing(false);
        resetTabCurrentStep();
    }

    backgroundPort.setMessageListener('init', (msg) => {
        const state = msg.data;
        initGlobalRecording(state.global.recording);
        initGlobalClicks(state.global.clicks);
        initTabPreviewing(state.tab.previewing);
        initTabCurrentStep(state.tab.currentStep);

        setReconnectionAttempts(0);
    });
    createEffect(() => {
        console.log('reconnectionAttempts', reconectionAttempts()); 
    });

    const sidebar: SidebarContextValue = [
        {
            global: { globalRecording, globalClicks, },
            tab: { tabPreviewing, tabCurrentStep, },
        },
        {
            global: { startGlobalRecording, stopGlobalRecording, },
            tab: { startTabPreviewing, stopTabPreviewing, },
        },
    ];

    return (
        <SidebarContext.Provider value={sidebar}>
            {props.children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() { return useContext(SidebarContext); }
