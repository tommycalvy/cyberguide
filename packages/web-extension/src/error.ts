
type Primative = string | number | boolean | null | undefined;

type JsonableArray = readonly Jsonable[];

type JsonableObject = { readonly [key: string]: Jsonable };

type JsonableToJSON = { toJSON(): Jsonable };

type Jsonable = Primative | JsonableArray | JsonableObject | JsonableToJSON;

export class BaseError extends Error {

    context?: Jsonable;

    constructor(message: string, { cause, context }: { cause?: Error, context?: Jsonable } = {}) {

        super(message, { cause });
        this.name = this.constructor.name;

        this.context = context;
    }
}
