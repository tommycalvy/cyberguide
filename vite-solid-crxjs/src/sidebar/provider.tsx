import {
    createContext,
    useContext,
    createSignal,
    createEffect
} from 'solid-js';
import { createStore } from 'solid-js/store';
import Port from '../utils/message-producer';
import { defaultSidebarProviderState } from '../types/defaults';

const SidebarContext = createContext();

export function SidebarProvider(props: { children: any }) {
    const [state, setState] = createStore(defaultSidebarProviderState);
    const [reconectionAttempts, setReconnectionAttempts] = createSignal(0);
    const backgroundPort = new Port('sb', setReconnectionAttempts);
    backgroundPort.setMessageListener('init', (msg) => {
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
                backgroundPort.send({ type: 'update', key, value });
            },
            stopRecording: () => {
                const key: ['global', 'recording'] = ['global', 'recording'];
                const value = false;
                setState(...key, value);
                backgroundPort.send({ type: 'update', key, value });
            },
            startPreview: () => {
                const key: ['tab', 'previewing'] = ['tab', 'previewing'];
                const value = true;
                setState(...key, value);
                backgroundPort.send({ type: 'update', key, value });
            },
            stopPreview: () => {
                const key: ['tab', 'previewing'] = ['tab', 'previewing'];
                const value = false;
                setState(...key, value);
                backgroundPort.send({ type: 'update', key, value });
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
