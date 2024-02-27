import { createContext, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Action } from './types';
import Port from './message-producer';
import { GlobalState, GuideCreatorState } from './types';

interface GuideCreatroProviderState extends GuideCreatorState {
    global: GlobalState;
}

const defaultGuideCreatorProviderState: GuideCreatroProviderState = {
    local: {
        currentStep: 0,
    },
    shared: {
        previewing: false,
    },
    global: {
        recording: false,
        actions: [],
    },
};

const GuideCreatorContext = createContext();

export function GuideCreatorProvider(props: { children: any }) {
    const [state, setState] = createStore(defaultGuideCreatorProviderState);
    const bport = new Port('gc');
    bport.setListener('gc-init-state', (msg) => {
        setState(msg.data);
    });

    const guideCreator = [
        state,
        {
            addGlobalAction: (action: Action) => {
                const key: ['global', 'actions', number] = ['global', 'actions', state.global.actions.length];
                const value = action;
                setState(...key, value);
                bport.send({ type: 'gc-update-state', data: { key, value, }});
            },
            incrementCurrentStep: () => {
                const key: ['local', 'currentStep'] = ['local', 'currentStep'];
                const value = (step: number) => step + 1;
                setState(...key, value);
                bport.send({ type: 'gc-update-state', data: { key, value, }});
            },
        },
    ];

    return (
        <GuideCreatorContext.Provider value={guideCreator}>
            {props.children}
        </GuideCreatorContext.Provider>
    );
}

export function useGuideCreator() { return useContext(GuideCreatorContext); }
