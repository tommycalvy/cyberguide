import { Channel } from './channel';
import browser from 'webextension-polyfill';

export function updateGlobalValue(key: string, channels: Channel[]) {
    const msgType = 'update-' + key;
    channels.forEach((channel) => {
        channel.onMessage(msgType, (port, msg) => {
            channels.forEach((channel) => {
                channel.sendToAll(msg, port.name);
            });
            browser.storage.local.set({ [key]: msg.data });
        });
    });
}
