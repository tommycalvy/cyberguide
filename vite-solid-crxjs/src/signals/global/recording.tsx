import { createSignal } from 'solid-js';
import Port from '../../utils/port';
import { defaultGlobalRecording } from '../../types/defaults';

const messageType = 'global-recording';

export default function useGlobalRecording(backgroundPort: Port) {
    const [globalRecording, setGlobalRecording] = createSignal(
        defaultGlobalRecording
    );

    function initGlobalRecording(globalRecording: boolean | undefined) {
        if (globalRecording !== undefined) { 
            setGlobalRecording(globalRecording);
        } else {
            throw new Error('On init global recording not found');
        }
    }

    backgroundPort.setMessageListener(messageType, (msg) => {
        const globalRecording = msg.data;
        if (globalRecording) {
            setGlobalRecording(globalRecording);
        } else {
            throw new Error('On update global recording not found');
        }
    });

    function startGlobalRecording() {
        console.log('startGlobalRecording', globalRecording());
        setGlobalRecording(true);
        const err = backgroundPort.send({ 
            type: messageType, 
            data: true,
        });
        if (err) {
            throw new Error(
                'backgroundPort.send failed in startGlobalRecording', 
                { cause: err },
            );
        }
    }

    function stopGlobalRecording() {
        setGlobalRecording(false);
        const err = backgroundPort.send({ 
            type: messageType, 
            data: false,
        });
        if (err) {
            throw new Error(
                'backgroundPort.send failed in stopGlobalRecording', 
                { cause: err },
            );
        }
    }

    return { 
        globalRecording,
        initGlobalRecording,
        startGlobalRecording,
        stopGlobalRecording
    };
}
