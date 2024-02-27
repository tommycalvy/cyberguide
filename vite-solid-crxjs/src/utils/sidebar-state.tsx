import { createContext, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import Port from './message-producer';
import { GlobalState, SidebarState } from './types';

interface SidebarProviderState extends SidebarState {
    global: GlobalState;
}

const defaultSidebarProviderState: SidebarProviderState = {
    shared: {
        previewing: false,
    },
    global: {
        recording: false,
        actions: [],
    },
};

const SidebarContext = createContext();

export function SidebarProvider(props: { children: any }) {
    const [state, setState] = createStore(defaultSidebarProviderState);
    const bport = new Port('sb');
    bport.setListener('sb-init-state', (msg) => {
        setState(msg.data);
    });

    const sidebar = [
        state,
        {
            startRecording: () => {
                const key: ['global', 'recording'] = ['global', 'recording'];
                const value = true;
                setState(...key, value);
                bport.send({ type: 'sb-update-state', data: { key, value, }});
            },
            stopRecording: () => {
                const key: ['global', 'recording'] = ['global', 'recording'];
                const value = false;
                setState(...key, value);
                bport.send({ type: 'sb-update-state', data: { key, value, }});
            },
            startPreview: () => {
                const key: ['shared', 'previewing'] = ['shared', 'previewing'];
                const value = true;
                setState(...key, value);
                bport.send({ type: 'sb-update-state', data: { key, value, }});
            },
            stopPreview: () => {
                const key: ['shared', 'previewing'] = ['shared', 'previewing'];
                const value = false;
                setState(...key, value);
                bport.send({ type: 'sb-update-state', data: { key, value, }});
            },
        },
    ];

    return (
        <SidebarContext.Provider value={sidebar}>
            {props.children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() { return useContext(SidebarContext); }
