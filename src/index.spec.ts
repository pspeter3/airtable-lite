import fetchMock from "jest-fetch-mock";
import {
    Airtable,
    AirtableError,
    AirtableRecord,
    AIRTABLE_API_URL,
    AIRTABLE_API_VERSION,
} from "./index";

describe("Constants", () => {
    it("should have Airtable API URL", () => {
        expect(AIRTABLE_API_URL).toBe("https://api.airtable.com");
    });

    it("should have Airtable API Version", () => {
        expect(AIRTABLE_API_VERSION).toBe("v0");
    });
});

describe("AirtableError", () => {
    it("should have the correct properties", () => {
        const status = 401;
        const type = "AUTHENTICATION_REQUIRED";
        const message = "Authentication required";
        const err = new AirtableError(status, type, message);
        expect(err.status).toBe(status);
        expect(err.type).toBe(type);
        expect(err.message).toBe(message);
    });

    it("should have the correct inheritance", () => {
        const err = new AirtableError(500, "", "");
        expect(err).toBeInstanceOf(AirtableError);
        expect(err).toBeInstanceOf(Error);
    });
});

describe("Airtable", () => {
    beforeAll(() => {
        fetchMock.enableMocks();
    });

    it("should support a simple constructor", () => {
        expect(() => new Airtable("", "", "")).not.toThrow();
    });

    describe("internals", () => {
        it("should construct URLs correctly", async () => {
            const base = "base";
            const table = "name";
            const id = "id";
            const client = new Airtable("", base, table);
            fetchMock.mockResponseOnce(async (req) => {
                expect(req.url).toBe(
                    [
                        AIRTABLE_API_URL,
                        AIRTABLE_API_VERSION,
                        base,
                        table,
                        id,
                    ].join("/")
                );
                return JSON.stringify({
                    id,
                    createdTime: new Date(),
                    fields: {},
                });
            });
            await client.find(id);
        });

        it("should add the correct headers", async () => {
            const key = "key";
            const id = "id";
            const client = new Airtable(key, "base", "table");
            fetchMock.mockResponseOnce(async (req) => {
                const headers = req.headers;
                expect(headers.get("Authorization")).toBe(`Bearer ${key}`);
                expect(headers.get("Content-Type")).toBe("application/json");
                return JSON.stringify({
                    id,
                    createdTime: new Date(),
                    fields: {},
                });
            });
            await client.find(id);
        });

        it("should handle errors", async () => {
            const status = 401;
            const type = "AUTHENTICATION_REQUIRED";
            const message = "Authentication required";
            const client = new Airtable("key", "base", "table");
            fetchMock.mockResponseOnce(
                JSON.stringify({
                    error: {
                        type,
                        message,
                    },
                }),
                { status }
            );
            await expect(() => client.find("id")).rejects.toThrowError(
                new AirtableError(status, type, message)
            );
        });
    });

    describe("find", () => {
        it("should return a record", async () => {
            const id = "id";
            const record = {
                id,
                createdTime: new Date().toString(),
                fields: {},
            };
            fetchMock.mockResponseOnce(async (req) => {
                expect(req.url).toMatch(new RegExp(`/${id}$`));
                expect(req.method).toBe("GET");
                return JSON.stringify(record);
            });
            const result = await new Airtable("", "", "").find(id);
            expect(result).toEqual(record);
        });
    });

    describe("create", () => {
        it("should create a record", async () => {
            const fields = {};
            const data = {
                id: "0",
                createdTime: new Date().toString(),
                fields,
            };
            fetchMock.mockResponseOnce(async (req) => {
                expect(req.method).toBe("POST");
                const body = await req.json();
                expect(body.fields).toEqual(fields);
                return JSON.stringify(data);
            });
            const record = await new Airtable("", "", "").create(fields);
            expect(record).toEqual(data);
        });

        it("should create a record with typecast", async () => {
            const fields = {};
            const data = {
                id: "0",
                createdTime: new Date().toString(),
                fields,
            };
            fetchMock.mockResponseOnce(async (req) => {
                expect(req.method).toBe("POST");
                const body = await req.json();
                expect(body.fields).toEqual(fields);
                expect(body.typecast).toBe(true);
                return JSON.stringify(data);
            });
            const record = await new Airtable("", "", "").create(fields, true);
            expect(record).toEqual(data);
        });
    });

    describe("update", () => {
        it("should update a record", async () => {
            const id = "0";
            const fields = {};
            fetchMock.mockResponseOnce(async (req) => {
                expect(req.url).toMatch(new RegExp(`/${id}$`));
                expect(req.method).toBe("PATCH");
                const body = await req.json();
                expect(body.fields).toEqual(fields);
                return JSON.stringify({
                    id,
                    createdTime: new Date(),
                    fields: body.fields,
                });
            });
            const record = await new Airtable("", "", "").update(id, fields);
            expect(record).toMatchObject({ id, fields });
        });

        it("should update a record with typecast", async () => {
            const id = "0";
            const fields = {};
            fetchMock.mockResponseOnce(async (req) => {
                expect(req.url).toMatch(new RegExp(`/${id}$`));
                expect(req.method).toBe("PATCH");
                const body = await req.json();
                expect(body.fields).toEqual(fields);
                expect(body.typecast).toBe(true);
                return JSON.stringify({
                    id,
                    createdTime: new Date(),
                    fields: body.fields,
                });
            });
            const record = await new Airtable("", "", "").update(
                id,
                fields,
                false,
                true
            );
            expect(record).toMatchObject({ id, fields });
        });

        it("should update a record destructively", async () => {
            const id = "0";
            const fields = {};
            fetchMock.mockResponseOnce(async (req) => {
                expect(req.url).toMatch(new RegExp(`/${id}$`));
                expect(req.method).toBe("PUT");
                const body = await req.json();
                expect(body.fields).toEqual(fields);
                return JSON.stringify({
                    id,
                    createdTime: new Date(),
                    fields: body.fields,
                });
            });
            const record = await new Airtable("", "", "").update(
                id,
                fields,
                true
            );
            expect(record).toMatchObject({ id, fields });
        });
    });

    describe("delete", () => {
        it("should delete a record", async () => {
            const id = "id";
            fetchMock.mockResponseOnce(async (req) => {
                expect(req.url).toMatch(new RegExp(`/${id}$`));
                expect(req.method).toBe("DELETE");
                return JSON.stringify({ id, deleted: true });
            });
            const result = await new Airtable("", "", "").delete(id);
            expect(result).toEqual({ id, deleted: true });
        });
    });

    describe("bulkCreate", () => {
        it("should create a list of records", async () => {
            fetchMock.mockResponseOnce(async (req) => {
                expect(req.method).toBe("POST");
                const body: {
                    records: { fields: Record<string, unknown> }[];
                } = await req.json();
                const records = body.records.map(({ fields }, index) => ({
                    id: index.toString(),
                    createdTime: new Date(),
                    fields,
                }));
                return JSON.stringify({ records });
            });
            const { records } = await new Airtable("", "", "").bulkCreate([
                {},
                {},
            ]);
            expect(records).toMatchObject([
                { id: "0", fields: {} },
                { id: "1", fields: {} },
            ]);
        });

        it("should create a list of records with typecast", async () => {
            fetchMock.mockResponseOnce(async (req) => {
                expect(req.method).toBe("POST");
                const body: {
                    records: { fields: Record<string, unknown> }[];
                    typecast?: boolean;
                } = await req.json();
                expect(body.typecast).toBe(true);
                const records = body.records.map(({ fields }, index) => ({
                    id: index.toString(),
                    createdTime: new Date(),
                    fields,
                }));
                return JSON.stringify({ records });
            });
            const { records } = await new Airtable("", "", "").bulkCreate(
                [{}, {}],
                true
            );
            expect(records).toMatchObject([
                { id: "0", fields: {} },
                { id: "1", fields: {} },
            ]);
        });
    });

    describe("bulkUpdate", () => {
        it("should update a list of records", async () => {
            fetchMock.mockResponseOnce(async (req) => {
                expect(req.method).toBe("PATCH");
                const body: {
                    records: ReadonlyArray<
                        Pick<
                            AirtableRecord<Record<string, unknown>>,
                            "id" | "fields"
                        >
                    >;
                } = await req.json();
                const records = body.records.map((record) => ({
                    ...record,
                    createdTime: new Date(),
                }));
                return JSON.stringify({ records });
            });
            const data = [
                { id: "0", fields: {} },
                { id: "1", fields: {} },
            ];
            const { records } = await new Airtable("", "", "").bulkUpdate(data);
            expect(records).toMatchObject(data);
        });

        it("should update a list of records with typecast", async () => {
            fetchMock.mockResponseOnce(async (req) => {
                expect(req.method).toBe("PATCH");
                const body: {
                    records: ReadonlyArray<
                        Pick<
                            AirtableRecord<Record<string, unknown>>,
                            "id" | "fields"
                        >
                    >;
                    typecast?: boolean;
                } = await req.json();
                expect(body.typecast).toBe(true);
                const records = body.records.map((record) => ({
                    ...record,
                    createdTime: new Date(),
                }));
                return JSON.stringify({ records });
            });
            const data = [
                { id: "0", fields: {} },
                { id: "1", fields: {} },
            ];
            const { records } = await new Airtable("", "", "").bulkUpdate(
                data,
                false,
                true
            );
            expect(records).toMatchObject(data);
        });

        it("should update a list of records destructively", async () => {
            fetchMock.mockResponseOnce(async (req) => {
                expect(req.method).toBe("PUT");
                const body: {
                    records: ReadonlyArray<
                        Pick<
                            AirtableRecord<Record<string, unknown>>,
                            "id" | "fields"
                        >
                    >;
                } = await req.json();
                const records = body.records.map((record) => ({
                    ...record,
                    createdTime: new Date(),
                }));
                return JSON.stringify({ records });
            });
            const data = [
                { id: "0", fields: {} },
                { id: "1", fields: {} },
            ];
            const { records } = await new Airtable("", "", "").bulkUpdate(
                data,
                true
            );
            expect(records).toMatchObject(data);
        });
    });

    describe("bulkDelete", () => {
        it("should delete a list of records", async () => {
            fetchMock.mockResponseOnce(async (req) => {
                expect(req.method).toBe("DELETE");
                const url = new URL(req.url);
                const ids = url.searchParams.getAll("records[]");
                return JSON.stringify({
                    records: ids.map((id) => ({ id, deleted: true })),
                });
            });
            const ids = ["1", "2", "3"];
            const { records } = await new Airtable("", "", "").bulkDelete(ids);
            expect(records).toEqual(ids.map((id) => ({ id, deleted: true })));
        });
    });
});
