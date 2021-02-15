# airtable-lite

Light weight type safe Airtable API client

## Requirements

-   Fetch
-   ES6
-   Airtable Account

## Installation

-   Find your Airtable API Key. Look [here](https://support.airtable.com/hc/en-us/articles/219046777-How-do-I-get-my-API-key-) for instructions.
-   Find your Base ID from the [Airtable API](https://airtable.com/api) documentation.
-   Install the library `npm install airtable-lite`.

## Examples

```ts
import {
    Airtable,
    AirtableDirection,
    AirtableError,
    createAirtableClient,
} from "airtable-lite";

// Constants
const API_KEY = "secret";
const BASE_ID = "baseID";

// A few ways to create tables
const users = new Airtable<{ Name: string; Notes: string }>(
    API_KEY,
    BASE_ID,
    "User"
);
const comments: Airtable<{ Name: string; User: string }> = createAirtableClient(
    API_KEY
)(BASE_ID)("Comments");
const createBase = createAirtableClient(API_KEY);
const createTable = createBase(BASE_ID);
const likes = createTable<{ Name: string; Count: number }>("Likes");

// CRUD operations
const { id } = await users.create({ Name: "Test" });
await users.update(id, { Notes: "Safe" });
await users.update(id, { Notes: "Destructive" }, true);
const user = await users.find(id);
await users.delete(id);

// Bulk operations
await comments.bulkCreate([{ Name: "First!", User: id }, { Name: "Test" }]);
await comments.bulkUpdate([
    { id: "1", fields: { Name: "Second!" } },
    { id: "2", fields: { User: id } },
]);
await comments.bulkDelete(["1", "2"]);

// Select
await likes.select({ maxRecords: 10 });
// Project with type safety.
// The `fields` option will only take valid field names.
// The records will only have 'Name' available in this example.
await likes.select({ fields: ["Name"] });
// Sort with type safety.
// The `sort` option will only take valid field names.
await likes.select({
    sort: [
        { field: "Name" },
        { field: "Count", direction: AirtableDirection.Descending },
    ],
});

// Also have type safe error handling
try {
    await users.find("1");
} catch (err) {
    if (err instanceof AirtableError) {
        console.log(err.status, err.type, err.message);
    }
}
```

## Documentation

TypeDoc documentation can be found on the [project homepage](https://pspeter3.github.io/airtable-lite/).
