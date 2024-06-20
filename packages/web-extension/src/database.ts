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

interface DBConfig<
    TDB extends DBSchema,
    TGetters extends AnyFunctionRecord,
    TSetters extends AnyFunctionRecord
> {
    dbName: string;
    dbVersion?: number;
    dbSchema: TDB;
    dbMethods: {
        getters: (db: IDBPDatabase<TDB>) => TGetters;
        setters: (db: IDBPDatabase<TDB>) => TSetters;
    };
};

class IndexedDBManager<
    TDB extends DBSchema,
    TGetters extends AnyFunctionRecord,
    TSetters extends AnyFunctionRecord
> {

    constructor(private config: DBConfig<TDB, TGetters, TSetters>) {}

    createRegisterDatabase() {

        return async (runtime: Runtime.Static) => {
            const dbSchema = this.config.dbSchema;
            const db = await openDB<TDB>(this.config.dbName, this.config.dbVersion || 1, {
                upgrade(db) {
                    for (const storeName of Object.keys(dbSchema) as StoreNames<TDB>[]) {
                        if (!db.objectStoreNames.contains(storeName)) {
                            db.createObjectStore(storeName);
                        }
                    }
                }
            });

            runtime.onMessage.addListener(
                typedEventListener<DBMessage, any>(( message, _sender, sendResponse) => {
                if (message.type === 'database') {
                    const response = this.config.dbMethods.getters(db)[message.method](db, ...message.args);
                    sendResponse(response);
                }
            }));

            return <K extends keyof TSetters>(method: K, args: Parameters<TSetters[K]>) => {
                return this.config.dbMethods.setters(db)[method](db, ...args);
            }
        }
    }


    createDatabaseMethods() {

        return (runtime: Runtime.Static, port: Runtime.Port) => {
            let getters: AnyFunctionRecord = {};
            let setters: AnyFunctionRecord = {};
            
            for (const method in this.config.dbMethods.setters) {
                setters[method] = (...args: any[]) => {
                    port.postMessage({ type: 'database', method, args });
                }
            }

            for (const method in this.config.dbMethods.getters) {
                getters[method] = (...args: any[]) => {
                    return createResource(async () => {
                        const response = await runtime.sendMessage({ type: 'database', method, args });
                        return response;
                    });
                }
            }

            return { getters, setters } as { getters: TransformedGetters<TGetters>, setters: TSetters };
        }

    }
}

type EventData = {
    id: string;
    events: eventWithTime[];
};

interface EventsDB extends DBSchema {
    events: {
        key: string;
        value: EventData;
    };
};

const eventsDBSchema: EventsDB = {
    events: {
        key: 'id',
        value: {
            id: '',
            events: [],
        },
    },
};

const dbManager = new IndexedDBManager({
    dbName: 'cyberguide',
    dbVersion: 1,
    dbSchema: eventsDBSchema,
    dbMethods: {
        getters: (db) => ({
            getEvents: async () => {
                return await db.get('events', 'events');
            },
        }),
        setters: (db) => ({
            addEvent: async (event: eventWithTime) => {
                await db.add('events', event, event);
            },
        }),
    },
});

