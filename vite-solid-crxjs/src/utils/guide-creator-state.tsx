import { createContext, useContext, createSignal, createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Action } from './types';
import Port from './message-producer';
import { defaultGuideBuilderProviderState } from './types';

const GuideBuilderContext = createContext();

export function GuideBuilderProvider(props: { children: any }) {
    const [state, setState] = createStore(defaultGuideBuilderProviderState);
    const [reconectionAttempts, setReconnectionAttempts] = createSignal(0);
    const bport = new Port('gc', setReconnectionAttempts);
    bport.setListener('init', (msg) => {
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
                const key: ['global', 'actions', number] = ['global', 'actions', state.global.actions.length];
                const value = action;
                setState(...key, value);
                bport.send({ type: 'update', data: { key, value, }});
            },
            incrementCurrentStep: () => {
                const key: ['local', 'currentStep'] = ['local', 'currentStep'];
                const value = (step: number) => step + 1;
                setState(...key, value);
                bport.send({ type: 'update', data: { key, value, }});
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
