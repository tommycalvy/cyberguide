import { describe, it, expect } from '@jest/globals';
import { BaseError } from './error-handling';

describe('BaseError', () => {
  it('should correctly instantiate with a message', () => {
    const errorMessage = 'Test error message';
    const error = new BaseError(errorMessage);

    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(Error); // Ensures inheritance from Error
    expect(error.message).toBe(errorMessage);
    expect(error.name).toBe('BaseError'); 
      // Based on the constructor name setting

    expect(error.context).toBeUndefined(); // Default when not provided
    expect(error.cause).toBeUndefined(); // Default when not provided
  });

  it('should correctly set the cause and context if provided', () => {
    const errorMessage = 'Test error message with cause and context';
    const cause = new Error('Underlying cause');
    const context = { key: 'value' }; // Example context
    const error = new BaseError(errorMessage, { cause, context });

    expect(error.cause).toBe(cause);
    expect(error.context).toEqual(context); 
      // Using toEqual for object comparison
  });
});

