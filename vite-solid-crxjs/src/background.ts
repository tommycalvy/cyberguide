import browser from 'webextension-polyfill';
import { Channel, ChannelListener } from '../src/utils/channel';
import gcScriptPath from '../src/guide-builder/index?script';
import { getCurrentTabId } from '../src/utils/tab';
import type { 
    GlobalState, 
    TabState,
    GuideBuilderState, 
    SidebarProviderState, 
    GuideBuilderProviderState,
    ProviderState,
    Instance,
    GuideBuilderInstance,
    SidebarInstance,
    StoredCache,
    Cache,
} from '../src/types/state';
import type { TabId } from '../src/types/extra';
import {
    defaultGuideBuilderState,
    defaultSidebarProviderState,
    defaultCache,
    defaultTabState,
} from '../src/types/defaults';

const storedCache = await browser.storage.local.get().catch((err) => {
    console.error(browser.runtime.lastError);
    console.error(err);
    return null;
});

let cache: Cache;
if (storedCache) {
    const { 
        globalState,
        tabStates,
        guideBuilderInstances,
        sidebarInstances,
        portNameToTabId,
    } = storedCache as StoredCache;
    cache = {
        globalState,
        tabStates: new Map(tabStates),
        guideBuilderInstances: new Map(guideBuilderInstances),
        sidebarInstances: new Map(sidebarInstances),
        portNameToTabId: new Map(portNameToTabId),
    };
} else {
    cache = defaultCache;
}

const channelListener = new ChannelListener();
const sidebarChannel = new Channel('sb', channelListener);
const guideBuilderChannel = new Channel('gb', channelListener);

sidebarChannel.onConnect(async (port) => {
    await initState(
        port, cache.sbs, defaultSidebarState, sbChannel, 
        cache.portNameToTabId
    );
});

guideBuilderChannel.onConnect(async (port) => {
    await initState(
        port, cache.gbs, defaultGuideBuilderState, gbChannel,
        cache.portNameToTabId
    );
});

sidebarChannel.onMessage('update', (port, msg) => {
});

async function initState(
    port: browser.Runtime.Port,
    cache: Cache,
    instanceName: string,
    instances: Map<TabId, GuideBuilderInstance | SidebarInstance>,
    providerState: GuideBuilderProviderState | SidebarProviderState,
    channel: Channel,
): Promise<void> {
    cache.portNameToTabId.set(port.name, tabId);

    providerState.global = cache.globalState;

    initTabState(cache.tabStates, tabId, providerState.tab);

    initInstance(instances, tabId, instanceName, port.name);

    channel.send(port.name, { type: 'init', data: providerState });
}

function updateState(
    port: browser.Runtime.Port,
    msg: Message,
    portNameToTabId: Map<string, TabId>,
    instances: Map<TabId, GuideBuilderInstance | SidebarInstance>,
    sharedInstances: Map<TabId, GuideBuilderInstance | SidebarInstance>,
) {
    if (!msg.key || !msg.value) {
        console.error('No key or value found in msg:', msg);
        port.disconnect();
        return;
    }
    const tabId = portNameToTabId.get(port.name);
    if (!tabId) {
        console.error('No tabId found for port:', port.name);
        port.disconnect();
        return;
    }
    const instance = instances.get(tabId);
    if (!instance) {
        console.error('No instance found for tabId:', tabId);
        port.disconnect();
        return;
    }
    const scope = msg.key.shift();
    if (scope === 'global') {
        setValue(cache.global, msg.key, msg.value);
    } else if (scope === 'shared') {
        setValue(sbi.state, msg.key, msg.value);
        const gbi = cache.gbs.get(tabId);
        if (gbi) {
            setValue(gbi.state, msg.key, msg.value);
        } else {
            console.error('No guide builder instance found for tabId:', tabId);
        }
    } else if (scope === 'local') {
        setValue(sbi.state, msg.key, msg.value);
    } else {
        console.error('Invalid scope:', scope);
    }
}

async function getTabIdFromMessageSender(port: browser.Runtime.Port): TabId | null {
    const senderTabId = port.sender?.tab?.id;
    let tabId: TabId;
    if (!senderTabId) {
        console.warn('No senderTabId found');
        const activeTabId = await getCurrentTabId();
        if (!activeTabId) {
            console.error('No senderTabId or activeTabId found');
            port.disconnect();
            return;
        }
        tabId = activeTabId;
    } else {
        tabId = senderTabId;
    }
}

function initTabState(
    tabStates: Map<TabId, TabState>,
    tabId: TabId,
    providerTabState: TabState
) {
    const tabState = tabStates.get(tabId);
    if (!tabState) {
        // Initialize tab state for tabId
        cache.tabStates.set(tabId, providerTabState);
        addTabStateToStorage(tabId, providerTabState);
    } else {
        providerTabState = tabState;
    }
}

function initInstance(
    instances: Map<TabId, GuideBuilderInstance | SidebarInstance>,
    tabId: TabId,
    instanceName: string,
    portName: string,
) {
    const instance = instances.get(tabId);
    if (!instance) {
        const newInstance: Instance = {
            portName: portName,
            tabId: tabId,
            connected: true,
        };
        instances.set(tabId, newInstance);
        addInstanceToStorage(instanceName, newInstance);
    } else {
        instance.portName = portName;
        instance.connected = true;
    }
}

function addInstanceToStorage(
    instanceName: string,
    instance: GuideBuilderInstance | SidebarInstance
) {
    browser.storage.local.get(instanceName).then(async (r) => {
        r[instanceName].push(instance);
        await browser.storage.local.set({ instanceName: r[instanceName] });
    }).catch((err) => {
        console.error(browser.runtime.lastError);
        console.error(err);
    });
}

function addTabStateToStorage(tabId: TabId, tabState: TabState) {
    browser.storage.local.get("tabStates").then(async (r) => {
        r.tabStates.push([tabId, tabState]);
        await browser.storage.local.set({ tabStates: r.tabStates });
    }).catch((err) => {
        console.error(browser.runtime.lastError);
        console.error(err);
    });
}

function setValue<T, V>(obj: T, props: string[], value: V): void {
    const lastProp = props.pop();
    if (!lastProp) throw new Error("props array cannot be empty");

    const lastObj = props.reduce((acc: any, prop: string) => {
        if (!acc[prop]) acc[prop] = {};
        return acc[prop];
    }, obj);

    lastObj[lastProp] = value;
}


/*

const [state, setState] = createStore({
    recording: false,
    gc: [],
});
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
*/
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

