import browser from 'webextension-polyfill';
import { Channel, ChannelListener } from '../src/utils/channel';
import gbScriptPath from '../src/guide-builder/index?script';
import { getCurrentTabId } from '../src/utils/tab';
import type { 
    GlobalState, 
    TabState,
    SidebarProviderState, 
    GuideBuilderProviderState,
    Instance,
    GuideBuilderInstance,
    SidebarInstance,
    StoredCache,
    Cache,
    TabId_To_Instance,
} from '../src/types/state';
import type { TabId } from '../src/types/extra';
import type { Message } from '../src/types/messaging';
import {
    defaultSidebarProviderState,
    defaultCache,
    defaultGuideBuilderProviderState,
} from '../src/types/defaults';

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });

const storedCache = await browser.storage.local.get().catch((err) => {
    console.error(browser.runtime.lastError);
    console.error(err);
    return null;
});

let cache: Cache;
if (storedCache) {
    const { 
        globalState,
        tabId_to_tabState,
        tabId_to_guideBuilderInstance,
        tabId_to_sidebarInstance,
        portName_to_tabId,
    } = storedCache as StoredCache;
    cache = {
        globalState,
        tabId_to_tabState: new Map(tabId_to_tabState),
        tabId_to_guideBuilderInstance: new Map(tabId_to_guideBuilderInstance),
        tabId_to_sidebarInstance: new Map(tabId_to_sidebarInstance),
        portName_to_tabId: new Map(portName_to_tabId),
    };
} else {
    cache = defaultCache;
}

let tabId_on_actionClicked: number | null = null;
browser.action.onClicked.addListener(async (tab) => {
    const tabId = tab.id;
    console.log('browser.action.onClicked');
    if (!tabId) {
        console.error('No tab.id found');
        return;
    }
    tabId_on_actionClicked = tabId;
    const guideBuilder = cache.tabId_to_guideBuilderInstance.get(tabId);
    if (!guideBuilder || !guideBuilder.connected) {
        browser.scripting.executeScript({
            target: { tabId },
            files: [gbScriptPath],
        });
    }

    chrome.sidePanel.setOptions({
        tabId,
        path: 'src/sidebar/index.html',
        enabled: true,
    });
    await chrome.sidePanel.open({ tabId });
});

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
        const guideBuilder = cache.tabId_to_guideBuilderInstance.get(tabId);
        if (!guideBuilder) {
            return;
        }
        if (!guideBuilder.connected) {
            browser.scripting.executeScript({
                target: { tabId },
                files: [gbScriptPath],
            });
        }
    }
});

const channelListener = new ChannelListener();
const sidebarChannel = new Channel('sb', channelListener);
const guideBuilderChannel = new Channel('gb', channelListener);

sidebarChannel.onConnect(async (port) => {
    await initState(
        port,
        cache,
        'sidebarInstances',
        cache.tabId_to_sidebarInstance,
        defaultSidebarProviderState,
        sidebarChannel,
    );
});

guideBuilderChannel.onConnect(async (port) => {
    await initState(
        port,
        cache,
        'guideBuilderInstances',
        cache.tabId_to_guideBuilderInstance,
        defaultGuideBuilderProviderState,
        guideBuilderChannel,
    );
});

sidebarChannel.onMessage('update', (port, msg) => {
    updateState(
        port,
        cache,
        msg,
        [sidebarChannel, guideBuilderChannel],
        [cache.tabId_to_guideBuilderInstance],
    );
});

guideBuilderChannel.onMessage('update', (port, msg) => {
    updateState(
        port,
        cache,
        msg,
        [sidebarChannel, guideBuilderChannel],
        [cache.tabId_to_sidebarInstance],
    );
});

sidebarChannel.onDisconnect((port) => {
    instanceDisconnect(port.name, cache, cache.tabId_to_sidebarInstance);
});

guideBuilderChannel.onDisconnect((port) => {
    instanceDisconnect(port.name, cache, cache.tabId_to_guideBuilderInstance);
});

async function initState(
    port: browser.Runtime.Port,
    cache: Cache,
    instancesName: string,
    instances: Map<TabId, GuideBuilderInstance | SidebarInstance>,
    providerState: GuideBuilderProviderState | SidebarProviderState,
    channel: Channel,
): Promise<void> {
    const tabId = await getTabIdFromMessageSender(port, (err) => {
        console.error(err);
    });

    if (!tabId) {
        console.error('No tabId found');
        port.disconnect();
        return;
    }

    const portName = port.name;

    cache.portName_to_tabId.set(portName, tabId);

    providerState.global = cache.globalState;

    initTabState(cache.tabId_to_tabState, tabId, providerState.tab);

    initInstance(instances, tabId, instancesName, portName, channel);

    channel.send(portName, { type: 'init', data: providerState });
}

function updateState(
    port: browser.Runtime.Port,
    cache: Cache,
    msg: Message,
    channels: Channel[],
    tabIds_to_instances: TabId_To_Instance[],
) {
    const key = msg.key;
    const value = msg.value;

    if (!key || !value) {
        console.error('No key or value found in msg:', msg);
        port.disconnect();
        return;
    } 
    
    const scope = key[0];
    const portName = port.name;

    if (scope === 'global') {
        updateGlobalState(cache.globalState, channels, portName, key, value);
        return;
    }

    const tabId = cache.portName_to_tabId.get(portName);
    if (!tabId) {
        console.error('No tabId found for port:', portName);
        port.disconnect();
        return;
    }

    if (scope === 'tab') {
        updateTabState(
            cache.tabId_to_tabState,
            tabId,
            tabIds_to_instances,
            key,
            value, 
            (err) => {
                console.error(err);
                port.disconnect();
            }
        );
        return;
    }
}

function instanceDisconnect(
    portName: string,
    cache: Cache,
    instances: Map<TabId, GuideBuilderInstance | SidebarInstance>,
) {
    const tabId = cache.portName_to_tabId.get(portName);
    if (!tabId) {
        console.error('No tabId found for port:', portName);
        return;
    }
    const instance = instances.get(tabId);
    if (!instance) {
        console.error('No instance found for tabId:', tabId);
        return;
    }
    instance.connected = false;
}

function updateTabState(
    tabStates: Map<TabId, TabState>,
    tabId: TabId,
    tabIds_to_instances: TabId_To_Instance[],
    key: any[],
    value: any,
    failure: (err: Error) => void,
) {
    let tabState = tabStates.get(tabId);
    if (!tabState) {
        failure(new Error(`No tabState found for tabId: ${tabId}`));
    }
    setValue(tabState, key.slice(1), value);
    tabIds_to_instances.forEach((tabId_to_instance) => {
        const instance = tabId_to_instance.get(tabId);
        if (!instance) {
            console.error('No instance found for tabId:', tabId);
        } else {
            instance.channel.send(instance.portName, { 
                type: 'update', key, value 
            });
        }
    });
}

function updateGlobalState(
    globalState: GlobalState,
    channels: Channel[],
    portName: string,
    key: any[],
    value: any
) {
    setValue(globalState, key.slice(1), value);
    channels.forEach((channel) => {
        channel.sendToAll({ type: 'update', key, value }, portName);
    });
}

async function getTabIdFromMessageSender(
    port: browser.Runtime.Port,
    failure: (err: Error) => void,
): Promise<TabId | null> {
    const senderTabId = port.sender?.tab?.id;
    if (senderTabId) {
        return senderTabId;
    }
    console.warn('No senderTabId found');

    if (tabId_on_actionClicked) {
        console.log('tabId_on_actionClicked is being used');
        const tabId = tabId_on_actionClicked;
        tabId_on_actionClicked = null;
        return tabId;
    }

    const activeTabId = await getCurrentTabId();
    if (activeTabId) {
        return activeTabId;
    }

    failure(new Error("Couldn't get tabId"));
    return null;
}

function initTabState(
    tabStates: Map<TabId, TabState>,
    tabId: TabId,
    providerTabState: TabState
) {
    const tabState = tabStates.get(tabId);
    if (!tabState) {
        tabStates.set(tabId, providerTabState);
        addTabStateToStorage(tabId, providerTabState);
    } else {
        providerTabState = tabState;
    }
}

function initInstance(
    instances: Map<TabId, GuideBuilderInstance | SidebarInstance>,
    tabId: TabId,
    instancesName: string,
    portName: string,
    channel: Channel,
) {
    const instance = instances.get(tabId);
    if (!instance) {
        const newInstance: Instance = {
            portName: portName,
            tabId: tabId,
            connected: true,
            channel,
        };
        instances.set(tabId, newInstance);
        addInstanceToStorage(instancesName, newInstance);
    } else {
        instance.portName = portName;
        instance.connected = true;
    }
}

function addInstanceToStorage(
    instancesName: string,
    instance: GuideBuilderInstance | SidebarInstance
) {
    browser.storage.local.get(instancesName).then(async (r) => {
        r[instancesName].push(instance);
        await browser.storage.local.set({ instancesName: r[instancesName] });
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
    if (lastObj[lastProp] === undefined) {
        console.error('No value found for props:', props);
        return;
    }
    lastObj[lastProp] = value;
}
