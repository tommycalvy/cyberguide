/**
* Represents a base error with optional context.
* @extends Error
*/
export class BaseError extends Error {

    /**
     * @param {string} message - The error message.
     * @param {Object} [options={}] - The options for the error.
     * @param {Error} [options.cause] - The underlying cause of the error.
     * @param {import('./jsonable').Jsonable} [options.context] 
        * - The context of the error, should be JSON serializable.
    */
    constructor(message, { cause, context } = {}) {

        super(message, { cause });
        this.name = this.constructor.name;

        this.context = context;
    }
}
