import { createSignal } from 'solid-js';
import Port from '../../utils/port';
import { Channel } from '../../utils/channel';
import browser from 'webextension-polyfill';
import { defaultTabPreviewing } from '../../types/defaults';

const msgType = 'tab-previewing';

export function useTabPreviewing(backgroundPort: Port) {
    const [tabPreviewing, setTabPreviewing] = createSignal(
        defaultTabPreviewing
    );

    function initTabPreviewing(tabPreviewing: boolean | undefined) {
        if (tabPreviewing) {
            setTabPreviewing(tabPreviewing);
        } else {
            console.error('On init tab previewing not found');
        }
    }

    backgroundPort.setMessageListener(msgType, (msg) => {
        const tabPreviewing = msg.data;
        if (tabPreviewing) {
            setTabPreviewing(tabPreviewing);
        } else {
            console.error('On update tab previewing not found');
        }
    });

    function startTabPreviewing() {
        setTabPreviewing(true);
        backgroundPort.send({ 
            type: msgType, 
            data: true,
        });
    }

    function stopTabPreviewing() {
        setTabPreviewing(false);
        backgroundPort.send({ 
            type: msgType, 
            data: false,
        });
    }

    return { 
        tabPreviewing,
        initTabPreviewing,
        startTabPreviewing,
        stopTabPreviewing
    };
}

export function updateTabPreviewingListener(channels: Channel[]) {
    channels.forEach((channel) => {
        channel.onMessage(msgType, (port, msg) => {
            const portName = port.name;
            channel.sendToAll(msg, portName);
            browser.storage.local.get('tabStates').then((r) => {
                const tabStates = r.tabStates;
                if (!Array.isArray(tabStates)) {
                    throw new Error('tabStates not found in storage');
                }
                if (tabStates.length === 0) {
                    throw new Error('tabStates is empty');
                }

                const index = tabStates.findIndex(
                    (tabState) => tabState[0] === portName
                );
                if (index === -1) {
                    throw new Error('tabState not found');
                }
                tabStates[index][1].previewing = msg.data;
                browser.storage.local.set({ tabStates });
            });
        });
    });
}
