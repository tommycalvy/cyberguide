import type { BaseError } from './base-error';

export type Result<T, E extends BaseError = BaseError> = 
    | { success: true, result: T } 
    | { success: false, error: E };
