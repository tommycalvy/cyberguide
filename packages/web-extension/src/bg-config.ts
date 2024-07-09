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
            getAllSteps: (guideName: string, callback: (steps: Step[]) => void) => {
                const transaction = db.transaction('guides', 'readonly');
                const store = transaction.objectStore('guides');
                const index = store.index('guideName');
                const steps = index.getAll(guideName);
                steps.onsuccess = () => {
                    callback(steps.result);
                }
            },
            addStep: async (step: Step, errorCallback: (error: Error) => void) => {
                const transaction = db.transaction('guides', 'readwrite');
                const store = transaction.objectStore('guides');
                const result = store.add(step);
                result.onerror = (event) => {
                    console.error(event);
                    const err = new BaseError('Error adding step');
                    errorCallback(err);
                }
            },
            getAllGuides: (callback) => {
                const transaction = db.transaction('guides', 'readonly');
                const store = transaction.objectStore('guides');
                const index = store.index('guideName');
                const cursorRequest = index.openCursor();
                const uniqueGuides = new Set();

                cursorRequest.onsuccess = event => {
                    const cursor = event.target.result;
                    if (cursor) {
                        // Add the guide name to the set if not already present
                        uniqueGuides.add(cursor.key);
                        // Move to the next unique guide name
                        cursor.continue();
                    } else {
                        // When cursor is null, we've traversed all records
                        callback(Array.from(uniqueGuides));
                    }
                };
                cursorRequest.onerror = event => {
                    console.error('Cursor request failed', event);
                };
            },
        })
    }).setOptions({
        namespace: 'cyberguide',
        logging: true,
        dbVersion: 1,
    }).build();


    
