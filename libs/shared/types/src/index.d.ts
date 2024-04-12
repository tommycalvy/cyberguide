import type { BaseError } from '@cyberguide/shared/error-handling';

export type Result<T, E extends BaseError = BaseError> = 
    | { success: true, result: T } 
    | { success: false, error: E };
