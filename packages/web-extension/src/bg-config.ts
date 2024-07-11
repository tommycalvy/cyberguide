import { BackgroundManager } from './bg-manager';
import type { eventWithTime } from 'rrweb';
import { BaseError } from './error';

interface Step {
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
            recording: false 
        },
        getters: (state) => ({ 
            isRecording: () => state.recording 
        }),
        actions: (setState, _) => ({
            startRecording: () => setState('recording', true),
            stopRecording: () => setState('recording', false) 
        })
    }).setRPC({
        init: ({ db }) => {
            if (!db.objectStoreNames.contains('guides')) {
                const guideStore = db.createObjectStore('guides', { 
                    keyPath: ['guideName', 'stepNumber'] 
                });
                guideStore.createIndex('guideName', 'guideName', { unique: false });
            }
        },
        methods: ({ db }) => ({
            getAllSteps: (callback: (steps: Step[]) => void, guideName: string) => {
                const transaction = db.transaction('guides', 'readonly');
                const store = transaction.objectStore('guides');
                const index = store.index('guideName');
                const steps = index.getAll(guideName);
                steps.onsuccess = () => {
                    callback(steps.result);
                }
            },
            addStep: (callback: (error: Error) => void, step: Step) => {
                const transaction = db.transaction('guides', 'readwrite');
                const store = transaction.objectStore('guides');
                const result = store.add(step);
                result.onerror = (event) => {
                    console.error(event);
                    const err = new BaseError('Error adding step');
                    callback(err);
                }
            },
            getListOfGuides: (callback: (guideNames: string[]) => void) => {
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
            },
        })
    }).build();

export const registerBackground = bg.createBackgroundStore();
export const sidepanelMethods = bg.createChannelMethods('sidepanel');
export const guidecreatorMethods = bg.createChannelMethods('guidecreator');
