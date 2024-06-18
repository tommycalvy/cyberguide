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

export const galacticSidebarStore = galacticStore.createChannelStore('sidebar');
export const galacticGuideCreatorStore = galacticStore.createChannelStore('guidecreator');
export type GalacticGuideCreatorStore = ReturnType<typeof galacticGuideCreatorStore>;
export const galacticBackgroundStore = galacticStore.createBackgroundStore();
