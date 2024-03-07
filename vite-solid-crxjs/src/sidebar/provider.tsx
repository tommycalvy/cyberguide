import {
    createContext,
    useContext,
    createSignal,
    createEffect
} from 'solid-js';
import Port from '../utils/port';
import type { SidebarStateAccessors } from '../types/state';
import { useGlobalRecording } from '../signals/global/recording';
import { useGlobalClicks } from '../signals/global/clicks';
import { useTabPreviewing } from '../signals/tab/previewing';
import { useTabCurrentStep } from '../signals/tab/current-step';

type SidebarContextValue = [
    state: SidebarStateAccessors,
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
            globalRecording: () => false,
            globalClicks: () => [],
        },
        tab: {
            tabPreviewing: () => false,
            tabCurrentStep: () => 0,
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
    const backgroundPort = new Port('sb', setReconnectionAttempts);

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
        startTabPreviewing,
        stopTabPreviewing,
    } = useTabPreviewing(backgroundPort);

    const {
        tabCurrentStep,
        initTabCurrentStep,
    } = useTabCurrentStep(backgroundPort);

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
