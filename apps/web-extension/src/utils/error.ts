export function errorHandler(functionName: string, cause: Error) {
    return new Error(`${functionName} failed`, { cause });
}

export function ensureError(value: unknown): Error {
    if (value instanceof Error) return value;

    let stringified = '[Unable to stringify the thrown value]';
    try {
        stringified = JSON.stringify(value);
    } catch {};

    return new Error(
        `This value was thrown as is, not through an Error: ${stringified}`
    )
}

type Jsonable = string | number | boolean | null | undefined | 
    readonly Jsonable[] | { readonly [key: string]: Jsonable } | 
    { toJSON(): Jsonable };

export class BaseError extends Error {
    public readonly context?: Jsonable

    constructor(
        message: string, 
        options: { cause?: Error, context?: Jsonable } = {}
    ) {
        const { cause, context } = options

        super(message, { cause })
        this.name = this.constructor.name

        this.context = context
    }
}

export type Result<T, E extends BaseError = BaseError> = 
    { success: true, result: T } | { success: false, error: E }
