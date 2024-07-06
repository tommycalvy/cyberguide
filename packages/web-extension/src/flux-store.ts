import { batch, untrack } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { createStore } from "solid-js/store";

/**
 * Type alias for any function with any number of arguments and any return type.
 */
export type AnyFunction = (...args: any[]) => any;
export type AnyFunctionsRecord = Record<string, AnyFunction>;

/**
 * Identify function creating an action - function for mutating the state.
 * Actions are `batch`ed and `untrack`ed by default - no need to wrap them in `batch` and `untrack`.
 * @param fn the function to wrap
 * @returns function of the same signature as `fn` but wrapped in `batch` and `untrack`
 */
export function createAction<T extends AnyFunction>(fn: T): T {
    return ((...args) => batch(() => untrack(() => fn(...args)))) as T;
}

/**
 * wraps each function in `actions` with `createAction` to improve performance and prevent unnecessary
 * re-renders and returns a new object of the same type
 * @param actions a collection of `Action` functions to wrap
 * @returns a new object of the same type but each function is wrapped with `createAction`
 export function createActions<T extends AnyFunctionsRecord>(functions: T): Actions<T> {
     const actions: Record<string, AnyFunction> = { ...functions };
     for (const [name, fn] of Object.entries(functions)) {
         actions[name] = createAction(fn);
     }
     return actions as any;
 }
 */

export function createActions<T extends AnyFunctionsRecord>(functions: T): T {
  const actions: Record<string, AnyFunction> = { ...functions };
  for (const [name, fn] of Object.entries(functions)) {
    actions[name] = createAction(fn);
  }
  return actions as any;
}
/**
 * Solid `Store` enforcing the Flux design pattern which emphasizes a one-way data flow. This typically
 * consists of separate actions that mutate the Store's `state` and `getters` enabling readonly access
 * to the Store's `state`. It is not required for a `FluxStore` to contain both `actions` and `getters`.
 *
 * @template `<T: state type of the store, G: store access methods | undefined, A: store mutation methods | undefined>`
 * @returns `{ state: T, getters: G, actions: A }`
 */
export type FluxStore<
     TState extends object,
     TActions extends AnyFunctionsRecord,
     TGetters extends AnyFunctionsRecord | undefined = undefined,
> = {
     state: TState;
     getters: TGetters;
     actions: TActions;
};

/**
 * Create a Solid 'Store' by specifying a state type and/or provide an `initialState` and
 * `createMethods` object typically consisting of separate actions that mutate the Store's `state` and
 * `getters` enabling readonly access to the Store's `state`.
 * @template `<T: state type of the store, G: store access methods | undefined, A: store mutation methods | undefined>`
 * @param initialState object to be wrapped in a Store
 * @param createMethods object containing functions to create `actions` and/or `getters`.
 * @returns `FluxStore`
 * @example
 * ```tsx
 * export const counterFluxStore = createFluxStore({
 *   value: 5,
 * }, {
 *  getters: state => ({
 *   count: () => state.value,
 *  }),
 *  actions: (setState, state) => ({
 *   increment: () => setState(val => ({ ...val, value: val.value + 1 })),
 *   reset: () => setState("value", 0),
 *  })
 * });
 *
 *
 *
 * const {state: counterState, getters: {count}, actions: {increment, reset}} = counterFluxStore;
 * count() // => 5
 * increment()
 * count() // => 6
 * reset() // => 0
 * ```
 */
export function createFluxStore<
     TState extends object,
     TActions extends AnyFunctionsRecord,
     TGetters extends AnyFunctionsRecord,
>(
     initialState: TState,
     createMethods: {
         getters: (state: TState) => TGetters;
         actions: (setState: SetStoreFunction<TState>, state: TState) => TActions;
     },
): FluxStore<TState, TActions, TGetters>;

export function createFluxStore<TState extends object, TActions extends AnyFunctionsRecord>(
     initialState: TState,
     createMethods: {
         actions: (setState: SetStoreFunction<TState>, state: TState) => TActions;
     },
): FluxStore<TState, TActions>;

export function createFluxStore<
     TState extends object,
     TActions extends AnyFunctionsRecord,
     TGetters extends AnyFunctionsRecord,
>(
     initialState: TState,
     createMethods: {
         getters?: (state: TState) => TGetters;
         actions: (setState: SetStoreFunction<TState>, state: TState) => TActions;
     },
): FluxStore<TState, TActions, TGetters | undefined> {
     const [state, setState] = createStore(initialState);
     return {
         state,
         getters: createMethods.getters ? createMethods.getters(state) : undefined,
         actions: createActions(createMethods.actions(setState, state)),
     };
}
