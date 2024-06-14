import { GalacticStore } from "./galactic-store";

const galacticStore = new GalacticStore({
    namespace: 'cyberguide',
    logging: true,
    store: {
        global: {
            state: {
                test: false,
            },
            getters: (state) => ({
                isTest: () => state.test,
            }),
            actions: (setState, state) => ({
                setTest: (test) => setState('test', test),
            }),
        },
        tab: {
            state: {
                recording: false,
            },
            getters: (state) => ({
                isRecording: () => state.recording,
            }),
            actions: (setState, state) => ({
                startRecording: () => setState('recording', true),
                stopRecording: () => setState('recording', false),
            }),
        },
        sidebar: {
            state: {
                sidebar: true,
            },
            getters: (state) => ({
                isSidebar: () => state.sidebar,
            }),
            actions: (setState, state) => ({
                setSidebar: (test) => setState('sidebar', test),
            }),
        },
        guideCreator: {
            state: {
                guidecreator: true,
            },
            getters: (state) => ({
                isGuidecreator: () => state.guidecreator,
            }),
            actions: (setState, state) => ({
                setGuidecreator: (test) => setState('guidecreator', test),
            }),
        },
    },
});

export const GalacticSidebarStore = galacticStore.createSidebarStore();
export const galacticGuideCreatorStore = galacticStore.createGuideCreatorStore();
export type GalacticGuideCreatorStore = ReturnType<typeof galacticGuideCreatorStore>;
export const GalacticBackgroundStore = galacticStore.createBackgroundStore();

export const testSidebarStore = galacticStore.createChannelStore('sidebar');
export type TestSidebarStore = ReturnType<typeof testSidebarStore>;
