import { BackgroundManager } from './bg-manager';
import type { eventWithTime } from 'rrweb';

export interface Step {
    guideName: string;
    guideNumber: number;
    stepName: string;
    stepNumber: number;
    events: eventWithTime[];
};

export interface Guide {
    guideName: string;
    guideNumber: number;
    dateCreated: Date;
};

export const guideNumberMultiplier = 1000000;

const bg = BackgroundManager.new()
    .setOptions({
        namespace: 'cyberguide',
        logging: true,
        dbVersion: 1,
    })
    .setGlobalStore({
        state: {
            guides: [] as Guide[],
        },
        getters: (state) => ({
            guideList: () => state.guides,
            numberOfGuides: () => state.guides.length,
        }),
        actions: (setState, state) => ({
            addGuide: (guideName: string) => {
                const guide: Guide = {
                    guideName,
                    guideNumber: state.guides.length,
                    dateCreated: new Date(),
                };
                setState('guides', [...state.guides, guide]);
            },
        })
    }).setTabStore({
        state: { 
            recording: false,
            guideName: 'fire-breathing-llama',
            stepNumber: 1,
            stepTitles: [] as string[],
        },
        getters: (state) => ({ 
            isRecording: () => state.recording,
            getGuideName: () => state.guideName,
            getStepNumber: () => state.stepNumber,
            getStepTitles: () => state.stepTitles,
        }),
        actions: (setState, state) => ({
            startRecording: () => setState('recording', true),
            stopRecording: () => setState('recording', false),
            setGuideName: (guideName: string) => setState('guideName', guideName),
            incrementStepNumber: () => setState('stepNumber', state.stepNumber + 1),
            resetStepNumber: () => setState('stepNumber', 1),
            addStepTitle: (stepTitle: string) => {
                setState('stepTitles', [...state.stepTitles, stepTitle])
            },
            resetStepTitles: () => setState('stepTitles', []),
        })
    }).setRPC({
        dbSchema: {
            guides: {
                key: '',
                value: {
                    guideName: 'fire-breathing-llama',
                    guideNumber: 0,
                    stepName: 'Untitled Step 1',
                    stepNumber: 1,
                    events: [],
                } as Step,
                indexes: { guideName: 'guideName' },
            },
        },
        init: ({ db }) => {
            if (!db.objectStoreNames.contains('guides')) {
                const guideStore = db.createObjectStore('guides', { autoIncrement: true });
                guideStore.createIndex('guideName', 'guideName', { unique: false });
            }
        },
        methods: ({ db }) => ({
            getGuideFromDB: (guideName: string): Promise<Step[]> => {
                return db.getAllFromIndex('guides', 'guideName', guideName);
            },
            addStepToDB: (step: Step): Promise<string> => {
                const key = step.guideNumber * guideNumberMultiplier + step.stepNumber;
                return db.add('guides', step, String(key));
            },
            getListOfGuides: (): Promise<string[]> => {
                return new Promise(async (resolve, _reject) => {
                    const tx = db.transaction('guides', 'readonly');
                    const index = tx.objectStore('guides').index('guideName');
                    let cursor = await index.openCursor(null, 'prev');
                    const guides: string[] = [];
                    while (cursor) {
                        const step = cursor.value;
                        guides.push(step.guideName);
                        cursor = await cursor.advance(step.stepNumber);
                    }
                    resolve(guides);
                });
            },
        })
    }).build();

export const registerBackground = bg.createBackgroundStore();
export const sidepanelMethods = bg.createChannelMethods('sidepanel');
export const guidecreatorMethods = bg.createChannelMethods('guidecreator');
