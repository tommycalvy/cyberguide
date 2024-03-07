import browser from 'webextension-polyfill';
import { Channel, ChannelListener } from '../src/utils/channel';
import gbScriptPath from '../src/guide-builder/index?script';
import type { 
    GlobalState, 
    TabState,
    GuideBuilderInstance,
    SidebarInstance,
    StoredCache,
} from '../src/types/state';
import type { TabId, PortName } from '../src/types/messaging';
import {
    defaultGlobalState,
    defaultTabState,
} from '../src/types/defaults';
import { updateGlobalRecordingListener } from './signals/global/recording';
import { updateGlobalClicksListener } from './signals/global/clicks';
import { updateTabPreviewingListener } from './signals/tab/previewing';
import { updateTabCurrentStepListener } from './signals/tab/currentStep';

class Background {

    channelListener: ChannelListener;
    sidebarChannel: Channel;
    guideBuilderChannel: Channel;

    globalState: GlobalState;
    tabStates: Map<TabId, TabState>;
    guideBuilders: Map<PortName, GuideBuilderInstance>;
    sidebars: Map<PortName, SidebarInstance>;

    constructor() {
        chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });

        this.channelListener = new ChannelListener();
        this.sidebarChannel = new Channel('sb', this.channelListener);
        this.guideBuilderChannel = new Channel('gb', this.channelListener);

        this.globalState = defaultGlobalState;
        this.tabStates = new Map();
        this.sidebars = new Map();
        this.guideBuilders = new Map();

        this.initCache();
        this.onActionClicked();
        this.onTabUpdated();

        this.onConnectInitInstance(
            'sidebars',
            this.sidebars,
            this.sidebarChannel
        );
        this.onConnectInitInstance(
            'guideBuilders',
            this.guideBuilders,
            this.guideBuilderChannel
        );
        
        const channels = [this.sidebarChannel, this.guideBuilderChannel];

        const globalStateKeys = ['recording', 'clicks'];

        channels.forEach((channel) => {
        });

        const tabStateKeys = ['previewing', 'currentStep'];
        tabStateKeys.forEach((key) => {
            channels.forEach((channel) => {
                this.onMessageUpdateTabState(channel, key);
            });
        });

    }

    initCache() {
        browser.storage.local.get().then((r) => {
            const storedCache = r as StoredCache;
            if (
                storedCache.globalState && 
                storedCache.tabStates &&
                storedCache.sidebars &&
                storedCache.guideBuilders
            ) {
                this.globalState = storedCache.globalState;
                this.tabStates = new Map(storedCache.tabStates);
                this.sidebars = new Map(storedCache.sidebars);
                this.guideBuilders = new Map(storedCache.guideBuilders);
            } else {
                browser.storage.local.set({
                    globalState: defaultGlobalState,
                    tabStates: [],
                    sidebars: [],
                    guideBuilders: [],
                }).catch((err) => {
                    console.error(browser.runtime.lastError);
                    console.error(err);
                });
            }
        }).catch((err) => {
            console.error(browser.runtime.lastError);
            console.error(err);
        });
    }

    onActionClicked() {
        browser.action.onClicked.addListener(async (tab) => {
            const tabId = tab.id;
            console.log('browser.action.onClicked');
            if (!tabId) {
                console.error('No tab.id found');
                return;
            }
            const guideBuilder = this.guideBuilders.get('gb-' + tabId);
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
    }

    onTabUpdated() {
        browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
            if (changeInfo.status === 'complete') {
                const guideBuilder = this.guideBuilders.get('gb-' + tabId);
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
    }

    onConnectInitInstance(
        instanceName: string,
        instances: Map<TabId, GuideBuilderInstance | SidebarInstance>,
        channel: Channel,
    ) {
        channel.onConnect((port) => {
            const portName = port.name;
            let instance = instances.get(portName);
            if (!instance) {
                instance = {
                    connected: true,
                };
                instances.set(portName, instance);
            } else {
                instance.connected = true;
            }
            this.addInstanceToStorage(instanceName, instance);

            const tabId = portName.split('-')[1];
            let tabState = this.tabStates.get(tabId);
            if (!tabState) {
                this.tabStates.set(tabId, defaultTabState);
                tabState = defaultTabState;
                this.addTabStateToStorage(tabId, tabState);
            }

            channel.send(portName, { type: 'init', data: {
                global: this.globalState,
                tab: tabState,
            }});
        });
    }

    addTabStateToStorage(tabId: TabId, tabState: TabState) {
        browser.storage.local.get('tabStates').then(async (r) => {
            const tabStates = r.tabStates;
            if (!Array.isArray(tabStates)) {
                throw new Error('No tabStates found in storage');
            }
            tabStates.push([tabId, tabState]);
            await browser.storage.local.set({ tabStates });
        }).catch((err) => {
            console.error(browser.runtime.lastError);
            console.error(err);
        });
    }

    addInstanceToStorage(
        instanceName: string,
        instance: GuideBuilderInstance | SidebarInstance
    ) {
        browser.storage.local.get(instanceName).then(async (r) => {
            const instances = r[instanceName];
            if (!Array.isArray(instances)) {
                throw new Error(`No ${instanceName} found in storage`);
            }
            instances.push(instance);
            await browser.storage.local.set({ [instanceName]: instances });
        }).catch((err) => {
            console.error(browser.runtime.lastError);
            console.error(err);
        });
    }

    onMessageUpdateGlobalState(
        channel: Channel,
        channels: Channel[],
        key: string
    ) {
        channel.onMessage('global-' + key, (port, msg) => {
            channels.forEach((channel) => {
                channel.sendToAll(msg, port.name);
            });
            browser.storage.local.get('globalState').then((r) => {
                const globalState = r.globalState;
                if (!globalState) {
                    throw new Error('globalState not found in storage');
                }
                globalState[key] = msg.data;
                browser.storage.local.set({ 
                    [key]: [...globalClicks, msg.data] 
                });
            });
        });
    }

    onMessageUpdateTabState(channel: Channel, key: string) {
        channel.onMessage('tab-' + key, (port, msg) => {
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
                tabStates[index][1][key] = msg.data;
                browser.storage.local.set({ tabStates });
            });
        });
    }
}

new Background();

/*
let storedCache;
browser.storage.local.get().then((r) => storedCache = r).catch((err) => {
    console.error(browser.runtime.lastError);
    console.error(err);
    return null;
});

let cache: Cache;
if (storedCache) {
    let { 
        globalState,
        tabId_to_tabState,
        tabId_to_guideBuilderInstance,
        tabId_to_sidebarInstance,
        portName_to_tabId,
    } = storedCache as StoredCache;

    if (!globalState) {
        globalState = defaultGlobalState;
        browser.storage.local.set({
            globalState: defaultGlobalState,
        }).catch((err) => {
            console.error(browser.runtime.lastError);
            console.error(err);
        });
    }
    if (!tabId_to_tabState) {
        tabId_to_tabState = [];
        browser.storage.local.set({
            tabId_to_tabState: [],
        }).catch((err) => {
            console.error(browser.runtime.lastError);
            console.error(err);
        });
    }
    if (!tabId_to_guideBuilderInstance) {
        tabId_to_guideBuilderInstance = [];
        browser.storage.local.set({
            tabId_to_guideBuilderInstance: [],
        }).catch((err) => {
            console.error(browser.runtime.lastError);
            console.error(err);
        });
    }
    if (!tabId_to_sidebarInstance) {
        tabId_to_sidebarInstance = [];
        browser.storage.local.set({
            tabId_to_sidebarInstance: [],
        }).catch((err) => {
            console.error(browser.runtime.lastError);
            console.error(err);
        });
    }
    if (!portName_to_tabId) {
        portName_to_tabId = [];
        browser.storage.local.set({
            portName_to_tabId: [],
        }).catch((err) => {
            console.error(browser.runtime.lastError);
            console.error(err);
        });
    }

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
if (!cache.globalState) {
    cache.globalState = defaultSidebarProviderState.global;
    browser.storage.local.set({ 
        globalState: defaultSidebarProviderState.global 
    }).catch((err) => {
        console.error(browser.runtime.lastError);
        console.error(err);
    });
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
    instanceName: string,
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

    initInstance(instances, tabId, instanceName, portName, channel);

    channel.send(portName, { type: 'init', data: providerState });
}

function updateState(
    port: browser.Runtime.Port,
    cache: Cache,
    msg: Message,
    channels: Channel[],
    tabIds_to_instances: TabId_To_Instance[],
) {
    const instanceName = msg.instanceName;
    const value = msg.value;

    if (!instanceName || !value) {
        console.error('No instanceName or value found in msg:', msg);
        port.disconnect();
        return;
    } 
    
    const scope = instanceName[0];
    const portName = port.name;

    if (scope === 'global') {
        updateGlobalState(cache.globalState, channels, portName, instanceName, value);
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
            instanceName,
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
    instanceName: any[],
    value: any,
    failure: (err: Error) => void,
) {
    let tabState = tabStates.get(tabId);
    if (!tabState) {
        failure(new Error(`No tabState found for tabId: ${tabId}`));
    }
    setValue(tabState, instanceName.slice(1), value);
    tabIds_to_instances.forEach((tabId_to_instance) => {
        const instance = tabId_to_instance.get(tabId);
        if (!instance) {
            console.error('No instance found for tabId:', tabId);
        } else {
            instance.channel.send(instance.portName, { 
                type: 'update', instanceName, value 
            });
        }
    });
}

function updateGlobalState(
    globalState: GlobalState,
    channels: Channel[],
    portName: string,
    instanceName: any[],
    value: any
) {
    setValue(globalState, instanceName.slice(1), value);
    channels.forEach((channel) => {
        channel.sendToAll({ type: 'update', instanceName, value }, portName);
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
    instanceName: string,
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
        if (!r[instanceName]) {
            console.error(`No ${instanceName} found in storage`);
            r[instanceName] = [];
        }
        r[instanceName].push(instance);
        await browser.storage.local.set({ instanceName: r[instanceName] });
    }).catch((err) => {
        console.error(browser.runtime.lastError);
        console.error(err);
    });
}

function addTabStateToStorage(tabId: TabId, tabState: TabState) {
    browser.storage.local.get("tabStates").then(async (r) => {
        if (!r.tabStates) {
            console.error('No tabStates found in storage');
            r.tabStates = [];
        }
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
*/
