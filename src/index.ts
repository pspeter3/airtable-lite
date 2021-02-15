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
 * Airtable client for a single table within a base.
 */
export class Airtable<T> {
    private readonly _apiKey: string;
    private readonly _base: string;
    private readonly _table: string;

    /**
     * Creates a client for a table with Airtable.
     * @param apiKey Your Airtable API Key.
     * @param base The Airable Base ID.
     * @param table The Airtable Table Name.
     */
    constructor(apiKey: string, base: string, table: string) {
        this._apiKey = apiKey;
        this._base = base;
        this._table = table;
    }

    /**
     * Finds a record by ID.
     * @param id The Record ID.
     */
    async find(id: string): Promise<AirtableRecord<T>> {
        return this._dispatch(
            new Request(this._createURL(id).toString(), {
                headers: this._createHeaders(),
            })
        );
    }

    private async _dispatch<R>(req: Request): Promise<R> {
        const res = await fetch(req);
        const data = await res.json();
        if (!res.ok) {
            const { error } = data as AirtableErrorResponse;
            throw new AirtableError(error.type, error.message);
        }
        return data;
    }

    private _createURL(...path: string[]): URL {
        return new URL(
            [AIRTABLE_API_VERSION, this._base, this._table, ...path].join("/"),
            AIRTABLE_API_URL
        );
    }

    private _createHeaders(json = true): Headers {
        const headers = new Headers();
        headers.set("Authorization", `Bearer ${this._apiKey}`);
        if (json) {
            headers.set("Content-Type", "application/json");
        }
        return headers;
    }
}

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

export interface AirtableFields<T> {
    readonly fields: T;
}

export interface AirtableRecord<T> extends AirtableFields<T> {
    readonly id: string;
    readonly createdTime: string;
}

interface AirtableErrorResponse {
    readonly error: {
        readonly type: string;
        readonly message: string;
    };
}
