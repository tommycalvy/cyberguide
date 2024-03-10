import { createSignal } from 'solid-js';
import Port from '../../utils/port';
import { defaultTabPreviewing } from '../../types/defaults';

const messageType = 'tab-previewing';

export default function useTabPreviewing(backgroundPort: Port) {
    const [tabPreviewing, setTabPreviewing] = createSignal(
        defaultTabPreviewing
    );

    function initTabPreviewing(tabPreviewing: boolean | undefined) {
        if (tabPreviewing) {
            setTabPreviewing(tabPreviewing);
        } else {
            throw new Error('On init tabPreviewing not found');
        }
    }

    backgroundPort.setMessageListener(messageType, (msg) => {
        const tabPreviewing = msg.data;
        if (tabPreviewing) {
            setTabPreviewing(tabPreviewing);
        } else {
            throw new Error('On update tabPreviewing not found in message');
        }
    });

    function startTabPreviewing() {
        setTabPreviewing(true);
        const err = backgroundPort.send({ 
            type: messageType, 
            data: true,
        });
        if (err) {
            throw new Error(
                'backgroundPort.send failed in startTabPreviewing', 
                { cause: err },
            );
        }
    }

    function stopTabPreviewing() {
        setTabPreviewing(false);
        const err = backgroundPort.send({ 
            type: messageType, 
            data: false,
        });
        if (err) {
            throw new Error(
                'backgroundPort.send failed in stopTabPreviewing', 
                { cause: err },
            );
        }
    }

    return { 
        tabPreviewing,
        initTabPreviewing,
        startTabPreviewing,
        stopTabPreviewing
    };
}
