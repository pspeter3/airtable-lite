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

    /**
     * Creates a record.
     * @param fields The fields of the record to create.
     * @param typecast Whether to typecast the record.
     */
    async create(fields: T, typecast?: true): Promise<AirtableRecord<T>> {
        return this._dispatch(
            new Request(this._createURL().toString(), {
                method: "POST",
                headers: this._createHeaders(),
                body: JSON.stringify({ fields, typecast }),
            })
        );
    }

    /**
     * Updates a single record.
     * @param id The record ID to update.
     * @param fields The fields to update.
     * @param destructive Whether to clear unspecified fields.
     * @param typecast Whether to typecast the record.
     */
    async update(
        id: string,
        fields: Partial<T>,
        destructive = false,
        typecast?: true
    ): Promise<AirtableRecord<T>> {
        return this._dispatch(
            new Request(this._createURL(id).toString(), {
                method: destructive ? "PUT" : "PATCH",
                headers: this._createHeaders(),
                body: JSON.stringify({ fields, typecast }),
            })
        );
    }

    /**
     * Deletes a record.
     * @param id The record ID to delete.
     */
    async delete(id: string): Promise<AirtableDeletion> {
        return this._dispatch(
            new Request(this._createURL(id).toString(), {
                method: "DELETE",
                headers: this._createHeaders(false),
            })
        );
    }

    /**
     * Bulk creates a list of record.
     * @param records The records to create.
     * @param typecast Whether to typecast the record.
     */
    async bulkCreate(
        records: ReadonlyArray<T>,
        typecast?: true
    ): Promise<AirtableRecordsResponse<AirtableRecord<T>>> {
        return this._dispatch(
            new Request(this._createURL().toString(), {
                method: "POST",
                headers: this._createHeaders(),
                body: JSON.stringify({
                    records: records.map((fields) => ({ fields })),
                    typecast,
                }),
            })
        );
    }

    /**
     * Bulk updates records.
     * @param records The records to update.
     * @param destructive Whether to clear unspecified fields.
     * @param typecast Whether to typecast the record.
     */
    async bulkUpdate(
        records: ReadonlyArray<
            Pick<AirtableRecord<Partial<T>>, "id" | "fields">
        >,
        destructive = false,
        typecast?: true
    ): Promise<AirtableRecordsResponse<AirtableRecord<T>>> {
        return this._dispatch(
            new Request(this._createURL().toString(), {
                method: destructive ? "PUT" : "PATCH",
                headers: this._createHeaders(),
                body: JSON.stringify({ records, typecast }),
            })
        );
    }

    /**
     * Bulk deletes a list of records.
     * @param ids The record IDs to delete.
     */
    async bulkDelete(
        ids: string[]
    ): Promise<AirtableRecordsResponse<AirtableDeletion>> {
        const url = this._createURL();
        for (const id of ids) {
            url.searchParams.append("records[]", id);
        }
        return this._dispatch(
            new Request(url.toString(), {
                method: "DELETE",
                headers: this._createHeaders(false),
            })
        );
    }

    private async _dispatch<R>(req: Request): Promise<R> {
        const res = await fetch(req);
        const data = await res.json();
        if (!res.ok) {
            const { error } = data as AirtableErrorResponse;
            throw new AirtableError(res.status, error.type, error.message);
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
    /**
     * The HTTP Status Code.
     */
    readonly status: number;
    /**
     * The Airtable API Error Type.
     */
    readonly type: string;

    /**
     * Creates an Airtable API error.
     * @param status The HTTP Status Code.
     * @param type The Airtable Error Type.
     * @param message The Airtable Error Message.
     */
    constructor(status: number, type: string, message: string) {
        super(message);
        this.status = status;
        this.type = type;
    }
}

/**
 * Generic interface for an Airtable Record.
 */
export interface AirtableRecord<T> {
    readonly id: string;
    readonly createdTime: string;
    readonly fields: T;
}

/**
 * Generic interface for an object containing Airtable Records.
 */
export interface AirtableRecordsResponse<T> {
    readonly records: ReadonlyArray<T>;
}

/**
 * Interface for Airtable deletion response.
 */
export interface AirtableDeletion {
    readonly id: string;
    readonly deleted: boolean;
}

interface AirtableErrorResponse {
    readonly error: {
        readonly type: string;
        readonly message: string;
    };
}
