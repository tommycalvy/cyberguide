import type { BaseError } from '@libs/shared/error-handling';

export type Result<T, E extends BaseError = BaseError> = 
    | { success: true, result: T } 
    | { success: false, error: E };
