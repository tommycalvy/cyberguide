import {
    createContext,
    useContext,
    createSignal,
    createEffect
} from 'solid-js';
import Port from '../utils/port';
import type { GuideBuilderStateAccessors, GlobalClick } from '../types/state';
import { useGlobalClicks } from '../signals/global/clicks';
import { useGlobalRecording } from '../signals/global/recording';
import { useTabCurrentStep } from '../signals/tab/current-step';
import { useTabPreviewing } from '../signals/tab/previewing';

type GuideBuilderContextValue = [
    state: GuideBuilderStateAccessors,
    actions: {
        global: {
            addGlobalClick: (click: GlobalClick) => void,
        },
        tab: {
            incrementTabCurrentStep: () => void,
        },
    },
];

const GuideBuilderContext = createContext<GuideBuilderContextValue>([
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
            addGlobalClick: () => undefined,
        },
        tab: {
            incrementTabCurrentStep: () => undefined,
        },
    },
]);

export function GuideBuilderProvider(props: { children: any }) {
    const [reconectionAttempts, setReconnectionAttempts] = createSignal(0);
    const backgroundPort = new Port('gb', setReconnectionAttempts);

    const {
        globalRecording,
        initGlobalRecording,
    } = useGlobalRecording(backgroundPort);

    const { 
        globalClicks,
        initGlobalClicks,
        addGlobalClick, 
    } = useGlobalClicks(backgroundPort);

    const {
        tabPreviewing,
        initTabPreviewing,
    } = useTabPreviewing(backgroundPort);

    const {
        tabCurrentStep,
        initTabCurrentStep,
        incrementTabCurrentStep,
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

    const guideBuilder: GuideBuilderContextValue = [
        {
            global: { globalRecording, globalClicks, },
            tab: { tabPreviewing, tabCurrentStep, },
        },
        {
            global: { addGlobalClick, },
            tab: { incrementTabCurrentStep, },
        },
    ];

    return (
        <GuideBuilderContext.Provider value={guideBuilder}>
            {props.children}
        </GuideBuilderContext.Provider>
    );
}

export function useGuideBuilder() { return useContext(GuideBuilderContext); }
