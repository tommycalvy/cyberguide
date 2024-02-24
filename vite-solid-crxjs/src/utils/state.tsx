import { createContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Action } from './types';
import Port from './message-producer';

export type GlobalState = {
    readonly recording: boolean;
    readonly actions: Action[];
};

export type GCState = {
    previewing: boolean;
    currentStep: number;
};

export type SBState = {
    previewing: boolean;
};

export type GCContextValue = [
    state: GlobalState,
    actions: {
        addAction: (action: Action) => void;
        incrementCurrentStep: () => void;
    }
];

const globalState: GlobalState = {
    recording: false,
    actions: [],
};

const gcState: GCState = {
    previewing: false,
    currentStep: 0,
};

const sbState: SBState = {
    previewing: false,
};

const GCContext = createContext<GCContextValue>([
    globalState,
    {
        addAction: () => undefined,
        incrementCurrentStep: () => undefined,
    },
]);

function fetchGCState(bport: Port) {
    return new Promise<GCState>((resolve) => {
        bport.setListener('gc-state', (msg) => {
            resolve(msg.data);
        });
        resolve(gcState);
    });
}

export function GCProvider(props: { children: any }) {
    const [state, setState] = createStore(globalState);

    const bport = new Port('gc');
    const [gcState] = createResource(fetchGC
    return (
        <GCContext.Provider value={[globalState, {
            addAction: (action: Action) => {
                globalState.actions.push(action);
            },
            incrementCurrentStep: () => {
                gcState.currentStep++;
            },
        }]}>
            {props.children}
        </GCContext.Provider>
    );
}
