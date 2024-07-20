import { BackgroundManager } from './bg-manager';
import type { eventWithTime } from 'rrweb';

export interface Step {
    guideName: string;
    stepNumber: number;
    stepName: string;
    events: eventWithTime[];
};

const bg = BackgroundManager.new()
    .setOptions({
        namespace: 'cyberguide',
        logging: true,
        dbVersion: 1,
    })
    .setTabStore({
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
                console.log('step added', stepTitle);
            },
            resetStepTitles: () => setState('stepTitles', []),
        })
    }).setRPC({
        dbSchema: {
            guides: {
                key: '',
                value: {
                    guideName: 'fire-breathing-llama',
                    stepNumber: 1,
                    stepName: 'Untitled Step 1',
                    events: [],
                } as Step,
                indexes: { guideName: 'guideName' },
            },
        },
        init: ({ db }) => {
            if (!db.objectStoreNames.contains('guides')) {
                const guideStore = db.createObjectStore('guides');
                guideStore.createIndex('guideName', 'guideName', { unique: false });
            }
        },
        methods: ({ db }) => ({
            getGuideFromDB: (guideName: string): Promise<Step[]> => {
                return db.getAllFromIndex('guides', 'guideName', guideName);
                /*
                const transaction = db.transaction('guides', 'readonly');
                const store = transaction.objectStore('guides');
                const index = store.index('guideName');
                const steps = index.getAll(guideName);
                steps.onsuccess = () => {
                    callback(steps.result);
                }
                */
            },
            addStepToDB: (step: Step): Promise<string> => {
                console.log('step', step);
                console.log('step.guideName', step.guideName);
                console.log('step.stepNumber', step.stepNumber);
                const key = `${step.guideName}${step.stepNumber}`;
                console.log('key', key);
                return db.add('guides', step, key);
                /*
                const transaction = db.transaction('guides', 'readwrite');
                const store = transaction.objectStore('guides');
                const result = store.add(step);
                result.onerror = (event) => {
                    console.error(event);
                    const err = new BaseError('Error adding step');
                    callback(err);
                }
                */
            },
            getListOfGuides: (): Promise<string[]> => {
                return new Promise(async (resolve, _reject) => {
                    const tx = db.transaction('guides', 'readonly');
                    const index = tx.objectStore('guides').index('guideName');
                    let cursor = await index.openCursor(null, 'prev');
                    const guides: string[] = [];
                    while (cursor) {
                        const step = cursor.value;
                        console.log('tx-step', step);
                        guides.push(step.guideName);
                        cursor = await cursor.advance(step.stepNumber);
                    }
                    resolve(guides);
                });
                /*
                const transaction = db.transaction('guides', 'readonly');
                const store = transaction.objectStore('guides');
                const index = store.index('guideName');
                const cursorRequest = index.openCursor(null, 'prev');
                const uniqueGuides: string[] = [];

                cursorRequest.onsuccess = (event) => {
                    const cursor = (event.target as IDBRequest<IDBCursor & { value: Step }>).result;
                    if (cursor) {
                        const step = cursor.value;
                        uniqueGuides.push(step.guideName);
                        cursor.advance(step.stepNumber);
                    } else {
                        // When cursor is null, we've traversed all records
                        callback(uniqueGuides);
                    }
                };
                cursorRequest.onerror = event => {
                    console.error('Cursor request failed', event);
                };
                */
            },
        })
    }).build();

export const registerBackground = bg.createBackgroundStore();
export const sidepanelMethods = bg.createChannelMethods('sidepanel');
export const guidecreatorMethods = bg.createChannelMethods('guidecreator');
