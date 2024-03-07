import { createSignal } from 'solid-js';
import Port from '../../utils/port';
import { Channel } from '../../utils/channel';
import browser from 'webextension-polyfill';

export const defaultGlobalRecordingValue = false;
const key = 'global-recording';
const msgType = 'update-' + key;

export function useGlobalRecording(backgroundPort: Port) {
    const [globalRecording, setGlobalRecording] = createSignal(
        defaultGlobalRecordingValue
    );

    function initGlobalRecording(globalRecording: boolean | undefined) {
        if (globalRecording) { 
            setGlobalRecording(globalRecording);
        } else {
            console.error('On init global recording not found');
        }
    }

    backgroundPort.setMessageListener(msgType, (msg) => {
        const globalRecording = msg.data;
        if (globalRecording) {
            setGlobalRecording(globalRecording);
        } else {
            console.error('On update global recording not found');
        }
    });

    function startGlobalRecording() {
        setGlobalRecording(true);
        backgroundPort.send({ 
            type: msgType, 
            data: true,
        });
    }

    function stopGlobalRecording() {
        setGlobalRecording(false);
        backgroundPort.send({ 
            type: msgType, 
            data: false,
        });
    }

    return { 
        globalRecording,
        initGlobalRecording,
        startGlobalRecording,
        stopGlobalRecording
    };
}

export function updateGlobalRecordingListener(channels: Channel[]) {
    channels.forEach((channel) => {
        channel.onMessage(msgType, (port, msg) => {
            channels.forEach((channel) => {
                channel.sendToAll(msg, port.name);
            });
            browser.storage.local.set({ [key]: msg.data });
        });
    });
}
