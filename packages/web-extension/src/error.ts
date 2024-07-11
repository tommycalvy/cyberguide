
type Primative = string | number | boolean | null | undefined;

type JsonableArray = readonly Jsonable[];

type JsonableObject = { readonly [key: string]: Jsonable };

type JsonableToJSON = { toJSON(): Jsonable };

export type Jsonable = Primative | JsonableArray | JsonableObject | JsonableToJSON;

export class BaseError extends Error {

    context?: Jsonable;

    constructor(message: string, { cause, context }: { cause?: Error, context?: Jsonable } = {}) {

        super(message, { cause });
        this.name = this.constructor.name;

        this.context = context;
    }
}

export type Result<T, E extends BaseError = BaseError> = 
    | { success: true, result: T } 
    | { success: false, error: E };

export function errorResult<TSuccess>(
    message: string,
    log: boolean,
    context?: Jsonable
): Result<TSuccess> {
    const error = new BaseError(message, { context });
    if (log) console.error(error);
    return { success: false, error };
}
