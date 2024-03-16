import browser from 'webextension-polyfill';
import GlobalListener from '../src/utils/global-listener';
import guideBuilderScriptPath from '../src/guide-builder/index?script';
import type { 
    GlobalState, 
    TabState,
    Instance,
} from '../src/types/state';
import type { TabId, PortName } from '../src/types/messaging';
import { defaultGlobalState, defaultTabState } from '../src/types/defaults';
import {
    errorHandler,
    BaseError,
} from '../src/utils/error';

class Background {

    globalListener: GlobalListener;

    globalState: GlobalState;
    tabIds: TabId[];
    tabStates: Map<TabId, TabState>;
    portNames: PortName[];
    instances: Map<PortName, Instance>;

    constructor() {
        chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });

        this.globalListener = new GlobalListener();

        this.globalState = defaultGlobalState;
        this.tabIds = [];
        this.tabStates = new Map();
        this.portNames = [];
        this.instances = new Map();
        console.log('Background.constructor');

        this.init((err) => {
            throw errorHandler('Background.initBackground', err);
        });
    }

    init(onError: (err: BaseError) => void) {
        this.onActionClicked((err) => {
            onError(errorHandler('Background.onActionClicked', err));
        });
        this.initCache().then(() => {
            console.log('cache initialized');
            this.onTabUpdated();

            this.onConnectInitInstance((err) => {
                onError(errorHandler('Background.onConnectInitInstance', err));
            });

            this.onDisconnect((err) => {
                onError(errorHandler('Background.onDisconnect', err));
            });
            
            this.onMessageUpdateGlobalVar('recording', (err) => {
                onError(errorHandler('Background.onMessageUpdateGlobalVar', err));
            });

            this.onMessageUpdateGlobalArray('clicks', (err) => {
                onError(
                    errorHandler('Background.onMessageUpdateGlobalArray', err)
                );
            });

            this.onMessageUpdateTabState('previewing');
            this.onMessageUpdateTabState('currentStep');
        });
    }


    async initCache() {
        const globalStatePromise = browser.storage.local.get('globalState');
        const tabIdsPromise = browser.storage.local.get('tabIds');
        const portNamesPromise = browser.storage.local.get('portNames');

        const [
            globalStateData,
            tabIdsData,
            portNamesData,
        ] = await Promise.all([
            globalStatePromise,
            tabIdsPromise,
            portNamesPromise,
        ]);
        this.globalState = globalStateData.globalState;
        this.tabIds = tabIdsData.tabIds;
        this.portNames = portNamesData.portNames;

        if (!(this.tabIds && this.portNames && this.globalState)) {
            await browser.storage.local.clear();
            await browser.storage.local.set({
                globalState: defaultGlobalState,
                tabIds: [],
                portNames: [],
            });
        }
        
        const instancePromises: Promise<Record<string, any>>[] = [];
        this.portNames.forEach((portName) => instancePromises.push(
            browser.storage.local.get(portName)
        ));
        const instanceDataPromise = Promise.all(instancePromises);

        const tabStatePromises: Promise<Record<string, any>>[] = [];
        this.tabIds.forEach((tabId) => tabStatePromises.push(
            browser.storage.local.get(tabId)
        ));
        const tabStateDataPromise = Promise.all(tabStatePromises);

        const [instanceData, tabStateData] = await Promise.all([
            instanceDataPromise,
            tabStateDataPromise,
        ]);
        for (let i = 0; i < instanceData.length; i++) {
            this.instances.set(
                this.portNames[i], instanceData[i][this.portNames[i]]
            );
        }
        for (let i = 0; i < tabStateData.length; i++) {
            this.tabStates.set(
                this.tabIds[i], tabStateData[i][this.tabIds[i]]
            );
        }
    }

    onActionClicked(onError: (err: Error) => void) {
        browser.action.onClicked.addListener(async (tab) => {
            const tabId = tab.id;
            console.log('browser.action.onClicked');
            if (!tabId) {
                onError(new Error('tabId not found'));
                return;
            }
            const guideBuilder = this.instances.get('gb-' + tabId);
            console.log('guideBuilder', guideBuilder);
            if (!guideBuilder || !guideBuilder.connected) {
                browser.scripting.executeScript({
                    target: { tabId },
                    files: [guideBuilderScriptPath],
                }).catch((err) => {
                    const error = new BaseError(
                        'executeScript failed',
                        { 
                            cause: err,
                            context: { tabId, guideBuilderScriptPath } 
                        }
                    );
                    return onError(error);
                });
            }

            chrome.sidePanel.setOptions({
                tabId,
                path: `src/sidebar/index.html?tabId=${tabId}`,
                enabled: true,
            });
            await chrome.sidePanel.open({ tabId });
        });
    }

    onTabUpdated() {
        browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
            if (changeInfo.status === 'complete') {
                const guideBuilder = this.instances.get('gb-' + tabId);
                if (guideBuilder && !guideBuilder.connected) {
                    browser.scripting.executeScript({
                        target: { tabId },
                        files: [guideBuilderScriptPath],
                    });
                }
            }
        });
    }

    onConnectInitInstance(onError: (err: BaseError) => void) {
        this.globalListener.onConnect(({ port, name, channelName, tabId }) => {

            if (!this.globalListener.allowedChannels.has(channelName)) {
                const err = new BaseError('Invalid channel', { 
                    context: { channelName } 
                });
                return onError(err);
            }

            let instance = this.instances.get(name);
            if (!instance) {
                instance = { connected: true };
                this.instances.set(name, instance);
                if (this.portNames.includes(name)) {
                    const err = new BaseError(
                        'PortName already exists in array but not in map',
                        { context: { name } }
                    );
                    return onError(err);
                }
                this.portNames.push(name);
            } else {
                instance.connected = true;
            }
            browser.storage.local.set({ [name]: instance });

            let tabState = this.tabStates.get(tabId);
            if (!tabState) {
                tabState = defaultTabState;
                this.tabStates.set(tabId, tabState);
                if (this.tabIds.includes(tabId)) {
                    const err = new BaseError(
                        'TabId already exists in array but not in map', 
                        { context: { tabId } }
                    );
                    return onError(err);
                }
                this.tabIds.push(tabId);
            }
            browser.storage.local.set({ [tabId]: tabState });

            port.postMessage({ type: 'init', data: {
                global: this.globalState,
                tab: tabState,
            }});
        });
    }

    onDisconnect(onError: (err: BaseError) => void) {
        this.globalListener.onDisconnect(({ name }) => {
            const instance = this.instances.get(name);
            if (!instance) {
                const err = new BaseError(
                    'Instance not found in map',
                    { context: { name } }
                );
                return onError(err);
            }
            instance.connected = false;
            browser.storage.local.set({ [name]: instance });
        });
    }

    onMessageUpdateGlobalVar(key: string, onError: (err: Error) => void) {
        this.globalListener.onMessage('global-' + key, (message, { name }) => {
            this.globalListener.sendToAll(message, name);
            browser.storage.local.get('globalState').then((r) => {
                const globalState = r.globalState;
                if (!globalState) {
                    onError(new Error('globalState not found in storage'));
                    return;
                }
                globalState[key] = message.data;
                browser.storage.local.set({ globalState });
            });
        });
    }

    onMessageUpdateGlobalArray(
        key: string,
        onError: (err: BaseError) => void,
    ) {
        this.globalListener.onMessage('global-' + key, (message, { name }) => {
            this.globalListener.sendToAll(message, name);
            browser.storage.local.get('globalState').then((r) => {
                const globalState = r.globalState;
                if (!globalState) {
                    onError(new Error('globalState not found in storage'));
                    return;
                }
                if (!Array.isArray(globalState[key])) {
                    const err = new BaseError(
                        'property of globalState is not an array',
                        { context: { key } }
                    );
                    return onError(err);
                }
                globalState[key].push(message.data);
                browser.storage.local.set({ globalState });
            });
        });
    }

    onMessageUpdateTabState(key: string) {
        this.globalListener.onMessage(
            'tab-' + key,
            (message, { channelName, tabId }
        ) => {
            this.globalListener.sendToTab(tabId, message, channelName);
            browser.storage.local.set({ [tabId]: message.data });
        });
    }
}
new Background();
