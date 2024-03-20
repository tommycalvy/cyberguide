import { createSignal } from 'solid-js';
import Port from '../../utils/port';
import type { GlobalClick } from '../../types/state';
import { defaultGlobalClicks } from '../../types/defaults';

const messageType = 'global-clicks';

export default function useGlobalClicks(backgroundPort: Port) {
    const [globalClicks, setGlobalClicks] = createSignal(defaultGlobalClicks);

    function initGlobalClicks(globalClicks: GlobalClick[] | undefined) {
        if (globalClicks !== undefined) {
            setGlobalClicks(globalClicks);
        } else {
            throw new Error('On init globalClicks not found');
        }
    }

    backgroundPort.setMessageListener(messageType, (msg) => {
        const globalClick = msg.data;
        if (globalClick !== undefined) {
            setGlobalClicks(
                (globalClicks: GlobalClick[]) => [...globalClicks, globalClick]
            );
        } else {
            throw new Error('On update globalClick not found in message');
        }
    });

    function addGlobalClick(globalClick: GlobalClick) {
        setGlobalClicks((globalClicks) => [...globalClicks, globalClick]);
        const sendResult = backgroundPort.send({ 
            type: messageType, 
            data: globalClick,
        });
        if (!sendResult.success) {
            throw new Error(
                'backgroundPort.send failed in addGlobalClick', 
                { cause: sendResult.error },
            );
        }
    }

    return { globalClicks, initGlobalClicks, addGlobalClick };
}
