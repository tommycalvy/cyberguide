type Primative = string | number | boolean | null | undefined;

type JsonableArray = readonly Jsonable[];

type JsonableObject = { readonly [key: string]: Jsonable };

type JsonableToJSON = { toJSON(): Jsonable };

type Jsonable = Primative | JsonableArray | JsonableObject | JsonableToJSON;

export { Jsonable };
