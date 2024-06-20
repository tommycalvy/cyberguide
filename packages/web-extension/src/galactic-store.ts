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
    tabId?: string;
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

    createChannelStore(channelName: 'sidebar' | 'guidecreator') {
        const portName = `${this._namespace}-${channelName}`;

        return ({ tabId, runtime }: ChannelOptions) => {
            const connectId = tabId ? portName + `#${tabId}` : portName;

            const port = runtime.connect({ name: connectId });

            const globalActions = this.createActions('global', port) as 
                (setState: SetStoreFunction<GlobalState>, state: GlobalState) => GlobalActions;

            const tabActions = this.createActions('tab', port) as
                (setState: SetStoreFunction<TabState>, state: TabState) => TabActions;

            const globalStore = createFluxStore(this._globalStore.state, { 
                actions: globalActions, getters: this._globalStore.getters });

            const tabStore = createFluxStore(this._tabStore.state, {
                actions: tabActions, getters: this._tabStore.getters });

            if (channelName === 'sidebar') {
                const sidebarActions = this.createActions('sidebar', port) as
                    (setState: SetStoreFunction<SidebarState>, state: SidebarState) => SidebarActions;
                const sidebarStore = createFluxStore(this._sidebarStore.state, {
                    actions: sidebarActions, getters: this._sidebarStore.getters
                });
                port.onMessage.addListener((message) => {
                    if (this._logging) console.log('Galactic message:', message);
                    if (message.type === 'action') {
                        const [path, actionName] = message.path;
                        if (path === 'global') {
                            globalStore.actions[actionName](false, ...message.args);
                        } else if (path === 'tab') {
                            tabStore.actions[actionName](false, ...message.args);
                        } else if (path === channelName) {
                            sidebarStore.actions[actionName](false, ...message.args);
                        }
                    } else if (message.type === 'database') {
                        
                    }
                });
                return { global: globalStore, tab: tabStore, sidebar: sidebarStore };
            } else {
                const guideCreatorActions = this.createActions('guidecreator', port) as
                    (setState: SetStoreFunction<GuideCreatorState>, state: GuideCreatorState) => GuideCreatorActions;
                const guideCreatorStore = createFluxStore(this._guideCreatorStore.state, {
                    actions: guideCreatorActions, getters: this._guideCreatorStore.getters
                });
                port.onMessage.addListener((message) => {
                    if (this._logging) console.log('Galactic message:', message);
                    if (message.type === 'action') {
                        const [path, actionName] = message.path;
                        if (path === 'global') {
                            globalStore.actions[actionName](false, ...message.args);
                        } else if (path === 'tab') {
                            tabStore.actions[actionName](false, ...message.args);
                        } else if (path === channelName) {
                            guideCreatorStore.actions[actionName](false, ...message.args);
                        }
                    }
                });
                return { global: globalStore, tab: tabStore, guidecreator: guideCreatorStore };
            }
        };
    }

    createActions(scope: 'global' | 'tab' | 'sidebar' | 'guidecreator', port: Runtime.Port) {
        const galacticActions: AnyFunctionsRecord = {};
        const modifyActions = (actions: AnyFunctionsRecord) => {
            for (const actionName in actions) {
                const originalAction = actions[actionName];

                galacticActions[actionName] = (galactic: boolean = true, ...args) => {
                    if (galactic) {
                        port.postMessage({ 
                            type: 'action',
                            path: [scope, actionName],
                            args,
                        });
                    }
                    return originalAction(...args);
                };
            }
            return galacticActions;
        }
        const actionCreator = {
            ['global']: () => {
                return (setState: SetStoreFunction<GlobalState>, state: GlobalState) => {
                    const globalActions = this._globalStore.actions(setState, state);
                    return modifyActions(globalActions) as GlobalActions;
                }
            },
            ['tab']: () => {
                return (setState: SetStoreFunction<TabState>, state: TabState) => {
                    const tabActions = this._tabStore.actions(setState, state);
                    return modifyActions(tabActions) as TabActions;
                }
            },
            ['sidebar']: () => {
                return (setState: SetStoreFunction<SidebarState>, state: SidebarState) => {
                    const sidebarActions = this._sidebarStore.actions(setState, state);
                    return modifyActions(sidebarActions) as SidebarActions;
                }
            },
            ['guidecreator']: () => {
                return (setState: SetStoreFunction<GuideCreatorState>, state: GuideCreatorState) => {
                    const guideCreatorActions = this._guideCreatorStore.actions(setState, state);
                    return modifyActions(guideCreatorActions) as GuideCreatorActions;
                }
            },
        }
        return actionCreator[scope]();
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
                        let port_set: Set<Port>;
                        if (path === 'global') {
                            port_set = ports;
                        } else if (path === 'tab') {
                            const tab_port_set = tab_ports.get(newPort.tabId);
                            if (!tab_port_set) {
                                const err = new BaseError('No tab ports found', { context: { tabId: newPort.tabId } });
                                if (this._logging) console.error(err);
                                return errorCallback(err);
                            } else {
                                port_set = tab_port_set;
                            }
                        } else if (path === 'sidebar') {
                            port_set = sidebar_ports;
                        } else if (path === 'guidecreator') {
                            port_set = guideCreator_ports;
                        } else {
                            const err = new BaseError('Invalid path', { context: { path } });
                            if (this._logging) console.error(err);
                            return errorCallback(err);
                        }
                        port_set.forEach((port) => {
                            if (port !== newPort) {
                                port.runtimePort.postMessage({ 
                                    type: 'action',
                                    path: [path, actionName],
                                    args: message.args,
                                });
                            }
                        });
                    } else if (message.type === 'rpc') {
                        if (this._logging) console.log('RPC message:', message);
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
