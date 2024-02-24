import browser from 'webextension-polyfill';
import { Channel, MessageListener } from '../src/utils/message-listener';
import gcScriptPath from '../src/guide-creator/index?script';
import { Action } from '../src/utils/types';
import { createStore } from 'solid-js/store';

console.log('background.ts');

interface GCState {
    recording: boolean;
    previewing: boolean;
}

interface GCInstance {
    portName: string;
    tabId: number;
    connected: boolean;
    state: GCState;
}

const sbTabId: Map<string, number> = new Map();
const tabIdGC: Map<number, GCInstance> = new Map();
const actions: Action[] = []; 
let recording = false;

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
let lastActiveTabId: number | null = null;
let lastActiveTabIdAssignmentsLeft = 0;

browser.action.onClicked.addListener(async (tab) => {
    console.log('browser.action.onClicked');
    if (!tab.id) {
        console.error('No tab.id found');
        return;
    }
    lastActiveTabId = tab.id;
    lastActiveTabIdAssignmentsLeft = 1;
    browser.scripting.executeScript({
        target: { tabId: tab.id },
        files: [gcScriptPath],
    });
    chrome.sidePanel.setOptions({
        tabId: tab.id,
        path: 'src/sidebar/index.html',
        enabled: true,
    });
    await chrome.sidePanel.open({ tabId: tab.id });
});

const messageListener = new MessageListener();
const gcChannel = new Channel('gc', messageListener);
const sbChannel = new Channel('sb', messageListener);

sbChannel.onConnect((port) => {
    if (lastActiveTabIdAssignmentsLeft > 0 && lastActiveTabId !== null) {
        sbTabId.set(port.name, lastActiveTabId);
        lastActiveTabIdAssignmentsLeft--;
    }
});

gcChannel.onConnect((port) => {
    const tabId = port.sender?.tab?.id;
    if (!tabId) {
        console.error('No tabId found for port:', port.name);
        return;
    }
    const gc = tabIdGC.get(tabId);
    if (!gc) {
        tabIdGC.set(tabId, {
            portName: port.name,
            tabId: tabId,
            connected: true,
            state: {
                recording: false,
                previewing: false,
            },
        });
    }
    if (lastActiveTabIdAssignmentsLeft > 0 && lastActiveTabId !== null) {
        lastActiveTabIdAssignmentsLeft--;
    }
});

gcChannel.onDisconnect((port) => {
    const tabId = port.sender?.tab?.id;
    if (!tabId) {
        console.error('No tabId found for port:', port.name);
        return;
    }
    const gc = tabIdGC.get(tabId);
    if (!gc) {
        console.error('No gcPortName found for port:', port.name);
        return;
    }
    gc.connected = false;
});

sbChannel.onMessage('start-recording', () => {
    recording = true;
    gcChannel.sendAll({ type: 'start-recording' });
    sbChannel.sendAll({ type: 'start-recording' });
});

sbChannel.onMessage('stop-recording', () => {
    recording = false;
    gcChannel.sendAll({ type: 'stop-recording' });
    sbChannel.sendAll({ type: 'stop-recording' });
});

gcChannel.onMessage('action', (msg) => {
    actions.push(msg.data);
    sbChannel.sendAll({ type: 'action', data: msg.data });
});

sbChannel.onMessage('start-preview', (_, port) => {
    const tabId = sbTabId.get(port.name);
    if (!tabId) {
        console.error('No tabId found for port:', port.name);
        return;
    } 
    browser.tabs.update(tabId, { active: true, url: actions[0].url });
    const gc = tabIdGC.get(tabId);
    if (!gc) {
        console.error('No gcPortName found for tabId:', tabId);
        return;
    }
    gcChannel.send(gc.portName, { type: 'start-preview' });
});

sbChannel.onMessage('stop-preview', (_, port) => {
    const tabId = sbTabId.get(port.name);
    if (!tabId) {
        console.error('No tabId found for port:', port.name);
        return;
    } 
    const gc = tabIdGC.get(tabId);
    if (!gc) {
        console.error('No gcPortName found for tabId:', tabId);
        return;
    }
    gcChannel.send(gc.portName, { type: 'stop-preview' });
});

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
        const gc = tabIdGC.get(tabId);
        if (!gc) {
            console.error('No gcPortName found for tabId:', tabId);
            return;
        }
        if (!gc.connected) {
            browser.scripting.executeScript({
                target: { tabId: tabId },
                files: [gcScriptPath],
            });
        }
    }
});
/*
let sbPorts: Map<string, browser.Runtime.Port> = new Map();
let gcPorts: Map<string, browser.Runtime.Port> = new Map();
browser.runtime.onConnect.addListener((port) => {
    if (port.name.startsWith('sb')) {
        sbPorts.set(port.name, port);
        console.log(port.name, 'sidebar connected');
        port.onDisconnect.addListener(() => {
            sbPorts.delete(port.name);
            console.log(port.name, 'sidebar disconnected');
        });
        port.onMessage.addListener((msg) => {
            console.log('sidebar message:', msg);
            if (msg.type === 'record') {
                if () {
                    port.postMessage({ type: 'record' });
                    gcPort.postMessage({ type: 'record' });
                }
            } else if (msg.type === 'stop') {
                if (gcPort) {
                    port.postMessage({ type: 'stop' });
                    gcPort.postMessage({ type: 'stop' });
                }
            }
        });
    } else if (port.name === 'gc') {
        gcPort = port;
        console.log('gc connected');
        port.onDisconnect.addListener(() => {
            console.log('gc disconnected');
        });
        port.onMessage.addListener((msg) => {
            console.log('gc message:', msg);
            if (msg.type === 'action') {
                if (sbPort) {
                    sbPort.postMessage({ type: 'action', action: msg.action });
                }
            }
        });
    }
});
// Clearing storage for development purposes
browser.storage.local.clear().then(() => {
    console.log('Storage cleared');
}).catch((err) => {
    console.error(browser.runtime.lastError);
    console.error(err);
});

function initCache(cache: Map<string, any>): void {
    if (!cache.has('gcs')) {
        cache.set('gcs', []);
    }
    if (!cache.has('count')) {
        cache.set('count', 0);
    } else {
        cache.set('count', cache.get('count') + 1);
    }
}

let cache: Map<string, any> = new Map();
browser.storage.local.get().then((r) => {
    cache = new Map(Object.entries(r)); 
    initCache(cache);
}).catch((err) => {
    console.error(err);
    initCache(cache);
});

const messageListener = new MessageListener();
const gcc = new Channel('gc', messageListener);

gcc.onDisconnect((tabId) => {
    console.log('gcc onDisconnect, tabId:', tabId);
    const gcs = cache.get('gcs');
    const index = gcs.indexOf(tabId);
    if (index > -1) {
        gcs.splice(index, 1);
        cache.set('gcs', gcs);
        browser.storage.local.set({ gcs: gcs }).catch((err) => {
            console.error(browser.runtime.lastError);
            console.error(err);
        });
    }
});

gcc.onMessage('init', (tabId, msg) => {
    console.log('init:', tabId, msg);
    gcc.postMessage(tabId, { type: 'init', message: 'sent state' });
});

browser.action.onClicked.addListener((tab) => {  
    console.log('browser.action.onClicked');
    if (!tab.id) {
        console.error('No tab.id found');
        return;
    }
    console.log('tab.id:', tab.id);
    if (cache.get('gcs').includes(tab.id)) {
        console.log('tab.id already exists');
        gcc.postMessage(tab.id, { type: 'open-widget' });
    } else {
        browser.scripting.executeScript({
            target: { tabId: tab.id },
            files: [gcScriptPath],
        });
        cache.set('gcs', [...cache.get('gcs'), tab.id]);
        browser.storage.local.set({ gcs: cache.get('gcs') }).catch((err) => {
            console.error(browser.runtime.lastError);
            console.error(err);
        });
    }
});
*/

