import { BaseError } from './error';
import type { Runtime } from 'webextension-polyfill';
import type { SetStoreFunction } from "solid-js/store";
import { AnyFunctionsRecord, createFluxStore } from './flux-store';

interface FluxStore<
    TState extends object,
    TActions extends AnyFunctionsRecord,
    TGetters extends AnyFunctionsRecord,
> {
    state: TState;
    getters: (state: TState) => TGetters;
    actions: (setState: SetStoreFunction<TState>, state: TState) => TActions;
}

interface GalaticStoreOptions<
    GlobalState extends object,
    GlobalActions extends AnyFunctionsRecord,
    GlobalGetters extends AnyFunctionsRecord,
    TabState extends object,
    TabActions extends AnyFunctionsRecord,
    TabGetters extends AnyFunctionsRecord,
    SidebarState extends object,
    SidebarActions extends AnyFunctionsRecord,
    SidebarGetters extends AnyFunctionsRecord,
    GuideCreatorState extends object,
    GuideCreatorActions extends AnyFunctionsRecord,
    GuideCreatorGetters extends AnyFunctionsRecord,
> {
    namespace: string;
    store: {
        global: FluxStore<GlobalState, GlobalActions, GlobalGetters>;
        tab: FluxStore<TabState, TabActions, TabGetters>;
        sidebar: FluxStore<SidebarState, SidebarActions, SidebarGetters>;
        guideCreator: FluxStore<GuideCreatorState, GuideCreatorActions, GuideCreatorGetters>;
    };
    logging?: boolean;
}

interface ChannelOptions {
    tabId?: number;
    runtime: Runtime.Static;
}

interface Port {
    name: string;
    channelName: string;
    tabId: string;
    runtimePort: Runtime.Port;
}

export class GalacticStore<
    GlobalState extends object,
    GlobalActions extends AnyFunctionsRecord,
    GlobalGetters extends AnyFunctionsRecord,
    TabState extends object,
    TabActions extends AnyFunctionsRecord,
    TabGetters extends AnyFunctionsRecord,
    SidebarState extends object,
    SidebarActions extends AnyFunctionsRecord,
    SidebarGetters extends AnyFunctionsRecord,
    GuideCreatorState extends object,
    GuideCreatorActions extends AnyFunctionsRecord,
    GuideCreatorGetters extends AnyFunctionsRecord,
> {
    _namespace: string;
    _globalStore: FluxStore<GlobalState, GlobalActions, GlobalGetters>;
    _tabStore: FluxStore<TabState, TabActions, TabGetters>;
    _sidebarStore: FluxStore<SidebarState, SidebarActions, SidebarGetters>;
    _guideCreatorStore: FluxStore<GuideCreatorState, GuideCreatorActions, GuideCreatorGetters>;
    _logging: boolean;

    constructor({ namespace, store, logging }: GalaticStoreOptions<
        GlobalState, GlobalActions, GlobalGetters,
        TabState, TabActions, TabGetters,
        SidebarState, SidebarActions, SidebarGetters,
        GuideCreatorState, GuideCreatorActions, GuideCreatorGetters
    >) {
        this._namespace = namespace;
        this._globalStore = store.global;
        this._tabStore = store.tab;
        this._sidebarStore = store.sidebar;
        this._guideCreatorStore = store.guideCreator;
        this._logging = logging || false;
    }

    createSidebarStore() {
        const portName = `${this._namespace}-sidebar`;

        return ({ tabId, runtime }: ChannelOptions) => {
            const connectId = tabId ? portName + `#${tabId}` : portName;

            const port = runtime.connect(connectId);

            const createGlobalActions = (setState: SetStoreFunction<GlobalState>, state: GlobalState) => {

                const galacticGlobalActions: AnyFunctionsRecord = {};
                const globalActions = this._globalStore.actions(setState, state);
                for (const actionName in globalActions) {
                    const originalAction = globalActions[actionName];

                    galacticGlobalActions[actionName] = (...args) => {
                        port.postMessage({ 
                            type: 'action',
                            path: ['global', actionName],
                            args,
                        });
                        return originalAction(...args);
                    };
                }
                return galacticGlobalActions as GlobalActions;
            };

            const createTabActions = (setState: SetStoreFunction<TabState>, state: TabState) => {
                const galacticTabActions: AnyFunctionsRecord = {};
                const tabActions = this._tabStore.actions(setState, state);
                for (const actionName in tabActions) {
                    const originalAction = tabActions[actionName];

                    galacticTabActions[actionName] = (...args) => {
                        port.postMessage({ 
                            type: 'action',
                            path: ['tab', actionName],
                            args,
                        });
                        return originalAction(...args);
                    };
                }
                return galacticTabActions as TabActions;
            };
                
            const createSidebarActions = (setState: SetStoreFunction<SidebarState>, state: SidebarState) => {
                const galacticSidebarActions: AnyFunctionsRecord = {};
                const sidebarActions = this._sidebarStore.actions(setState, state);
                for (const actionName in sidebarActions) {
                    const originalAction = sidebarActions[actionName];

                    galacticSidebarActions[actionName] = (...args) => {
                        port.postMessage({ 
                            type: 'action',
                            path: ['sidebar', actionName],
                            args,
                        });
                        return originalAction(...args);
                    };
                }
                return galacticSidebarActions as SidebarActions;
            };

            const globalStore = createFluxStore(this._globalStore.state, { 
                actions: createGlobalActions, getters: this._globalStore.getters });

            const tabStore = createFluxStore(this._tabStore.state, {
                actions: createTabActions, getters: this._tabStore.getters });

            const sidebarStore = createFluxStore(this._sidebarStore.state, {
                actions: createSidebarActions, getters: this._sidebarStore.getters });

            port.onMessage.addListener((message) => {
                if (this._logging) console.log('Galactic message:', message);
                if (message.type === 'action') {
                    const [path, actionName] = message.path;
                    if (path === 'global') {
                        globalStore.actions[actionName](...message.args);
                    } else if (path === 'tab') {
                        tabStore.actions[actionName](...message.args);
                    } else if (path === 'sidebar') {
                        sidebarStore.actions[actionName](...message.args);
                    }
                }
            });

            return { global: globalStore, tab: tabStore, sidebar: sidebarStore };
        };

    }

    createGuideCreatorStore() {
        const portName = `${this._namespace}-guidecreator`;

        return ({ tabId, runtime }: ChannelOptions) => {
            const connectId = tabId ? portName + `#${tabId}` : portName;

            const port = runtime.connect(connectId);

            const createGlobalActions = (setState: SetStoreFunction<GlobalState>, state: GlobalState) => {

                const galacticGlobalActions: AnyFunctionsRecord = {};
                const globalActions = this._globalStore.actions(setState, state);
                for (const actionName in globalActions) {
                    const originalAction = globalActions[actionName];

                    galacticGlobalActions[actionName] = (...args) => {
                        port.postMessage({ 
                            type: 'action',
                            path: ['global', actionName],
                            args,
                        });
                        return originalAction(...args);
                    };
                }
                return galacticGlobalActions;
            };

            const createTabActions = (setState: SetStoreFunction<TabState>, state: TabState) => {
                const galacticTabActions: AnyFunctionsRecord = {};
                const tabActions = this._tabStore.actions(setState, state);
                for (const actionName in tabActions) {
                    const originalAction = tabActions[actionName];

                    galacticTabActions[actionName] = (...args) => {
                        port.postMessage({ 
                            type: 'action',
                            path: ['tab', actionName],
                            args,
                        });
                        return originalAction(...args);
                    };
                }
                return galacticTabActions;
            };
                
            const createGuideCreatorActions = (setState: SetStoreFunction<GuideCreatorState>, state: GuideCreatorState) => {
                const galacticGuideCreatorActions: AnyFunctionsRecord = {};
                const guideCreatorActions = this._guideCreatorStore.actions(setState, state);
                for (const actionName in guideCreatorActions) {
                    const originalAction = guideCreatorActions[actionName];

                    galacticGuideCreatorActions[actionName] = (...args) => {
                        port.postMessage({ 
                            type: 'action',
                            path: ['guidecreator', actionName],
                            args,
                        });
                        return originalAction(...args);
                    };
                }
                return galacticGuideCreatorActions;
            };

            const globalStore = createFluxStore(this._globalStore.state, { 
                actions: createGlobalActions, getters: this._globalStore.getters });

            const tabStore = createFluxStore(this._tabStore.state, {
                actions: createTabActions, getters: this._tabStore.getters });

            const guideCreatorStore = createFluxStore(this._guideCreatorStore.state, {
                actions: createGuideCreatorActions, getters: this._guideCreatorStore.getters });

            port.onMessage.addListener((message) => {
                if (this._logging) console.log('Galactic Message:', message);
                if (message.type === 'action') {
                    const [path, actionName] = message.path;
                    if (path === 'global') {
                        globalStore.actions[actionName](...message.args);
                    } else if (path === 'tab') {
                        tabStore.actions[actionName](...message.args);
                    } else if (path === 'sidebar') {
                        guideCreatorStore.actions[actionName](...message.args);
                    }
                }
            });

            return { global: globalStore, tab: tabStore, guideCreator: guideCreatorStore };
        };

    }

    createBackgroundStore() {
        return (runtime: Runtime.Static, errorCallback: (err: BaseError) => void) => { 
            const ports = new Set<Port>(); 
            const tab_ports = new Map<string, Set<Port>>();
            const sidebar_ports = new Set<Port>();
            const guideCreator_ports = new Set<Port>();

            runtime.onConnect.addListener((runtimePort) => { 

                if (this._logging) console.log('New connection attempt...');

                let [namespace, channelName] = runtimePort.name.split('-');
                if (namespace !== this._namespace) {
                    const err = new BaseError('Invalid namespace', { 
                        context: { namespace } 
                    });
                    if (this._logging) console.error(err);
                    return errorCallback(err);
                }

                let tabId = runtimePort.sender?.tab?.id?.toString();
                if (!tabId) {
                    [channelName, tabId] = channelName.split('#');
                    if (tabId && isNaN(parseFloat(tabId))) {
                        const err = new BaseError( 'tabId is not a number', { context: { tabId } });
                        if (this._logging) console.error(err);
                        return errorCallback(err);
                    }
                }
                if (!tabId) {
                    const err = new BaseError('No tabId in port.sender or port.name', {
                        context: { portName: runtimePort.name }
                    });
                    if (this._logging) console.error(err);
                    return errorCallback(err);
                }

                if (channelName !== 'sidebar' && channelName !== 'guidecreator') {
                    const err = new BaseError('Invalid channel', { context: { channelName } });
                    if (this._logging) console.error(err);
                    return errorCallback(err);
                }

                const newPort: Port = { name: runtimePort.name, channelName: channelName, tabId, runtimePort };

                ports.add(newPort);

                if (channelName === 'sidebar') {
                    sidebar_ports.add(newPort);
                } else if (channelName === 'guidecreator') {
                    guideCreator_ports.add(newPort);
                }

                const tab = tab_ports.get(tabId);
                if (!tab) {
                    tab_ports.set(tabId, new Set([newPort]));
                } else {
                    tab.add(newPort);
                }

                if (this._logging) console.log(`${newPort.name} connected:`, newPort);

                runtimePort.onMessage.addListener((message) => {
                    if (this._logging) console.log(`${newPort.name} message:`, message);
                    if (message.type === 'action') {
                        const [path, actionName] = message.path;
                        if (path === 'global') {
                            ports.forEach((port) => {
                                if (port !== newPort) {
                                    port.runtimePort.postMessage({ 
                                        type: 'action',     
                                        path: ['global', actionName],
                                        args: message.args,
                                    });
                                }
                            });
                        } else if (path === 'tab') {
                            const tabPorts = tab_ports.get(newPort.tabId);
                            if (!tabPorts) {
                                const err = new BaseError('No tab ports found', { context: { tabId: newPort.tabId } });
                                if (this._logging) console.error(err);
                                return errorCallback(err);
                            }
                            tabPorts.forEach((port) => {
                                if (port !== newPort) {
                                    port.runtimePort.postMessage({ 
                                        type: 'action',
                                        path: ['tab', actionName],
                                        args: message.args,
                                    });
                                }
                            });
                        } else if (path === 'sidebar') {
                            sidebar_ports.forEach((port) => {
                                if (port !== newPort) {
                                    port.runtimePort.postMessage({ 
                                        type: 'action',
                                        path: ['sidebar', actionName],
                                        args: message.args,
                                    });
                                }
                            });
                        } else if (path === 'guidecreator') {
                            guideCreator_ports.forEach((port) => {
                                if (port !== newPort) {
                                    port.runtimePort.postMessage({ 
                                        type: 'action',
                                        path: ['guidecreator', actionName],
                                        args: message.args,
                                    });
                                }
                            });
                        }
                    } else {
                        const err = new BaseError('Invalid message type', { context: { message } });
                        if (this._logging) console.error(err);
                        return errorCallback(err);
                    }
                });
            });
        }
    }
}
