import {
    createContext,
    useContext,
    createSignal,
    createEffect
} from 'solid-js';
import { createStore } from 'solid-js/store';
import type { Action } from '../types/extra';
import Port from '../utils/message-producer';
import { defaultGuideBuilderProviderState } from '../types/defaults';

const GuideBuilderContext = createContext();

export function GuideBuilderProvider(props: { children: any }) {
    const [state, setState] = createStore(defaultGuideBuilderProviderState);
    const [reconectionAttempts, setReconnectionAttempts] = createSignal(0);
    const backgroundPort = new Port('gc', setReconnectionAttempts);
    backgroundPort.setMessageListener('init', (msg) => {
        if (msg.data) {
            setState(msg.data);
        } else {
            setState(defaultGuideBuilderProviderState);
        }
        setReconnectionAttempts(0);
    });
    createEffect(() => {
        console.log('reconnectionAttempts', reconectionAttempts()); 
    });

    const guideBuilder = [
        state,
        {
            addGlobalAction: (action: Action) => {
                const key: ['global', 'actions', number] = [
                    'global', 'actions', state.global.actions.length
                ];
                const value = action;
                setState(...key, value);
                backgroundPort.send({ type: 'update', data: { key, value, }});
            },
            incrementCurrentStep: () => {
                const key: ['local', 'currentStep'] = ['local', 'currentStep'];
                const value = (step: number) => step + 1;
                setState(...key, value);
                backgroundPort.send({ type: 'update', data: { key, value, }});
            },
        },
    ];

    return (
        <GuideBuilderContext.Provider value={guideBuilder}>
            {props.children}
        </GuideBuilderContext.Provider>
    );
}

export function useGuideBuilder() { return useContext(GuideBuilderContext); }
