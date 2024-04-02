import { createSignal } from 'solid-js';
import Port from '../../utils/port';
import { defaultTabPreviewing } from '../../types/defaults';

const messageType = 'tab-previewing';

export default function useTabPreviewing(backgroundPort: Port) {
    const [tabPreviewing, setTabPreviewing] = createSignal(
        defaultTabPreviewing
    );

    function initTabPreviewing(tabPreviewing: boolean | undefined) {
        if (tabPreviewing !== undefined) {
            setTabPreviewing(tabPreviewing);
        } else {
            throw new Error('On init tabPreviewing not found');
        }
    }

    backgroundPort.setMessageListener(messageType, (msg) => {
        const tabPreviewing = msg.data;
        if (tabPreviewing !== undefined) {
            setTabPreviewing(tabPreviewing);
        } else {
            throw new Error('On update tabPreviewing not found in message');
        }
    });

    function changeTabPreviewing(tabPreviewing: boolean) {
        setTabPreviewing(tabPreviewing);
        const sendResult = backgroundPort.send({ 
            type: messageType, 
            data: tabPreviewing,
        });
        if (!sendResult.success) {
            throw new Error(
                'backgroundPort.send failed in setTabPreviewing', 
                { cause: sendResult.error },
            );
        }
    }

    return { 
        tabPreviewing,
        initTabPreviewing,
        changeTabPreviewing,
    };
}
