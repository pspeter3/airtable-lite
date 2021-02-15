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
    it("should support a simple constructor", () => {
        expect(() => new Airtable("", "", "")).not.toThrow();
    });
});
