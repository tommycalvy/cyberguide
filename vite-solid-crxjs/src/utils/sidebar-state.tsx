import { createContext, useContext, createSignal, createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';
import Port from './message-producer';
import { defaultSidebarProviderState } from './types';

const SidebarContext = createContext();

export function SidebarProvider(props: { children: any }) {
    const [state, setState] = createStore(defaultSidebarProviderState);
    const [reconectionAttempts, setReconnectionAttempts] = createSignal(0);
    const bport = new Port('sb', setReconnectionAttempts);
    bport.setListener('init', (msg) => {
        if (msg.data) {
            setState(msg.data);
        } else {
            setState(defaultSidebarProviderState);
        }
        setReconnectionAttempts(0);
    });
    createEffect(() => {
        console.log('reconnectionAttempts', reconectionAttempts()); 
    });

    const sidebar = [
        state,
        {
            startRecording: () => {
                const key: ['global', 'recording'] = ['global', 'recording'];
                const value = true;
                setState(...key, value);
                bport.send({ type: 'update', key, value });
            },
            stopRecording: () => {
                const key: ['global', 'recording'] = ['global', 'recording'];
                const value = false;
                setState(...key, value);
                bport.send({ type: 'update', key, value });
            },
            startPreview: () => {
                const key: ['shared', 'previewing'] = ['shared', 'previewing'];
                const value = true;
                setState(...key, value);
                bport.send({ type: 'update', key, value });
            },
            stopPreview: () => {
                const key: ['shared', 'previewing'] = ['shared', 'previewing'];
                const value = false;
                setState(...key, value);
                bport.send({ type: 'update', key, value });
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
