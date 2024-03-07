import { createSignal } from 'solid-js';
import Port from '../../utils/port';
import { Channel } from '../../utils/channel';
import browser from 'webextension-polyfill';
import type { GlobalClick } from '../../types/state';
import { defaultGlobalClicks } from '../../types/defaults';

const key = 'global-clicks';
const msgType = 'update-' + key;

export function useGlobalClicks(backgroundPort: Port) {
    const [globalClicks, setGlobalClicks] = createSignal(defaultGlobalClicks);

    function initGlobalClicks(globalClicks: GlobalClick[] | undefined) {
        if (globalClicks) {
            setGlobalClicks(globalClicks);
        } else {
            console.error('On init global clicks not found');
        }
    }

    backgroundPort.setMessageListener(msgType, (msg) => {
        const globalClick = msg.data;
        if (globalClick) {
            setGlobalClicks(
                (globalClicks: GlobalClick[]) => [...globalClicks, globalClick]
            );
        } else {
            console.error('On update global clicks not found');
        }
    });

    function addGlobalClick(globalClick: GlobalClick) {
        setGlobalClicks((globalClicks) => [...globalClicks, globalClick]);
        backgroundPort.send({ 
            type: msgType, 
            data: globalClick,
        });
    }

    return { globalClicks, initGlobalClicks, addGlobalClick };
}

export function updateGlobalClicksListener(channels: Channel[]) {
    channels.forEach((channel) => {
        channel.onMessage(msgType, (port, msg) => {
            channels.forEach((channel) => {
                channel.sendToAll(msg, port.name);
            });
            browser.storage.local.get(key).then((data) => {
                const globalClicks = data[key] || defaultGlobalClicks;
                browser.storage.local.set({ 
                    [key]: [...globalClicks, msg.data] 
                });
            });
        });
    });
}
