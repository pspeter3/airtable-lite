/**
 * The Airtable base API URL.
 * Used as the base for constructing URL objects.
 */
export const AIRTABLE_API_URL = "https://api.airtable.com";
/**
 * The Airtable API version for the client.
 */
export const AIRTABLE_API_VERSION = "v0";

/**
 * Subclass of error to represent Airtable API specific errors.
 */
export class AirtableError extends Error {
    readonly type: string;

    /**
     * Creates an Airtable API error.
     * @param type The Airtable Error type.
     * @param message The Airtable Error message.
     */
    constructor(type: string, message: string) {
        super(message);
        this.type = type;
    }
}
