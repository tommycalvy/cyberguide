import { createResource } from "solid-js";
import type { ResourceReturn } from "solid-js";
import type { eventWithTime } from "rrweb";
import { openDB, DBSchema, type IDBPDatabase, type StoreNames } from "idb";
import { Runtime } from "webextension-polyfill";

function typedEventListener<TMessage, TResponse>(listener: (
                message: TMessage,
                sender: Runtime.MessageSender,
                sendResponse: (message: TResponse) => void,
            ) => Promise<TResponse> | true | void) {
    return listener as (
                message: unknown,
                sender: Runtime.MessageSender,
                sendResponse: (message: unknown) => void,
            ) => Promise<unknown> | true | void;
};

interface DBMessage {
    type: string;
    method: string;
    args: any;
};

type AnyFunction = (...args: any[]) => any;
type AnyFunctionRecord = Record<string, AnyFunction>;

type ResourceGetter<T extends AnyFunction> = (...args: Parameters<T>) => ResourceReturn<ReturnType<T>>;

type TransformedGetters<T extends AnyFunctionRecord> = { [K in keyof T]: ResourceGetter<T[K]> };

interface DBConfig<TMethods extends AnyFunctionRecord> {
    name: string;
    version?: number;
    init: (db: IDBDatabase) => void;
    methods: (db: IDBDatabase) => TMethods;
};

class IndexedDBManager<TMethods extends AnyFunctionRecord> {

    private name: string;
    private version?: number;
    private methods: (db: IDBDatabase) => TMethods;

    constructor({ name, version, methods }: DBConfig<TMethods>) {
        this.name = name;
        this.version = version;
        this.methods = methods;
    }

    createRegisterDatabase() {

        return (runtime: Runtime.Static) => {
            let db:IDBDatabase;
            //const db = await openDB<TDB>(this.config.dbName, this.config.dbVersion || 1);
            const DBOpenRequest = indexedDB.open(this.name, this.version || 1);

            DBOpenRequest.onerror = (event) => {
                console.log('Error loading database', event);
            };

            DBOpenRequest.onsuccess = () => {
                db = DBOpenRequest.result;
                console.log('Database loaded', db);
            };

            DBOpenRequest.onupgradeneeded = (event) => {
                db = DBOpenRequest.result;
                console.log('Database upgrade needed', db);
                console.log('event', event);
                //TODO: move data from old version to new version
            };

            runtime.onMessage.addListener(
                typedEventListener<DBMessage, any>(( message, _sender, sendResponse) => {
                if (message.type === 'database') {
                    const response = this.methods(db)[message.method](db, ...message.args);
                    sendResponse(response);
                }
            }));

            return <K extends keyof TMethods>(method: K, args: Parameters<TMethods[K]>) => {
                return this.methods(db)[method](...args);
            }
        }
    }


}

interface Step {
    guideName: string;
    stepNumber: number;
    stepName: string;
    events: eventWithTime[];
};

// TODO: Going to add a solidjs store in front of the database and use the galactic store to
// manage the signals

const dbManager = new IndexedDBManager({
    name: 'cyberguide',
    version: 1,
    init: (db) => {
        if (!db.objectStoreNames.contains('guides')) {
            const guideStore = db.createObjectStore('guides');
            guideStore.createIndex('guideName', 'guideName', { unique: false });
        }
    },
    methods: (db) => ({
        initNewGuide: (name: string, errorCallback: (error: Error) => void) => {
            if (db.objectStoreNames.contains(name)) {
                errorCallback(new Error('Guide already exists'));
            } else {
                db.createObjectStore(name, { autoIncrement: true });
            }
        },
        getAllSteps: (guideName: string, callback: (steps: Step[]) => void) => {
            const transaction = db.transaction(guideName, 'readonly');
            const store = transaction.objectStore(guideName);
            const steps = store.getAll();
            steps.onsuccess = () => {
                callback(steps.result);
            }
        },
        addStep: async (guideName: string, step: Step, errorCallback: (error: Error) => void) => {
            const transaction = db.transaction(guideName, 'readwrite');
            const store = transaction.objectStore(guideName);
            const result = store.add(step);
            result.onerror = () => {
                errorCallback(result.error);
            }
        },
    }),
});

export const registerDatabase = dbManager.createRegisterDatabase();

/*
    createDatabaseMethods() {
        return (runtime: Runtime.Static, port: Runtime.Port) => {
            console.log('returning database methods');
            const getters: AnyFunctionRecord = {};
            const setters: AnyFunctionRecord = {};
            const methods: AnyFunctionRecord = {};

            const createMethods = (db: IDBDatabase) => {
                for (const method in this.methods(db)) {
                    console.log('method', method);
                    methods[method] = (...args: any[]) => {
                        return createResource(async () => {
                            const response = await runtime.sendMessage({ type: 'database', method, args });
                            return response;
                        });
                    }
                }

            const createGetters = (db: IDBDatabase) => {
                const originalGetters = this.config.dbMethods.getters(db);
                for (const method in originalGetters) {
                    console.log('method', method);
                    getters[method] = (...args: any[]) => {
                        return createResource(async () => {
                            const response = await runtime.sendMessage({ type: 'database', method, args });
                            return response;
                        });
                    }
                }
            };

            const createSetters = (db: IDBDatabase) => {
                const originalSetters = this.config.dbMethods.setters(db);
                for (const method in originalSetters) {
                    console.log('method', method);
                    setters[method] = (...args: any[]) => {
                        port.postMessage({ type: 'database', method, args });
                    }
                }
            }
            createGetters({} as IDBDatabase);
            createSetters({} as IDBDatabase);

            return { getters, setters } as { getters: TransformedGetters<TGetters>, setters: TSetters };
        }

    }
*/
