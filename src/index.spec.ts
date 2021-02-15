import fetchMock from "jest-fetch-mock";
import {
    Airtable,
    AirtableError,
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
        const type = "AUTHENTICATION_REQUIRED";
        const message = "Authentication required";
        const err = new AirtableError(type, message);
        expect(err.type).toBe(type);
        expect(err.message).toBe(message);
    });

    it("should have the correct inheritance", () => {
        const err = new AirtableError("", "");
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
            const client = new Airtable("key", "base", "table");
            fetchMock.mockResponseOnce(
                JSON.stringify({
                    error: {
                        type: "AUTHENTICATION_REQUIRED",
                        message: "Authentication required",
                    },
                }),
                { status: 401 }
            );
            await expect(() => client.find("id")).rejects.toThrowError(
                AirtableError
            );
        });
    });
});
