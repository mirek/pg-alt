## Summary

Install:

    npm i -S pg-alt

## Usage:

```JavaScript
const pg = require('pg-alt');

const db = pg('postgres://user:pass@localhost:5432/db?ssl=false');

async () => {
  log('now is', await db.value(pg.sql`select ${pg.now};`));
}();
```

## Api

```JavaScript
const pg = require('pg-alt');

const db = pg('postgres://user:pass@localhost:5432/db?ssl=false');

// From async context:
await db.value('select 1'); // single value
await db.row('select 1 one, 2 two'); // single row, { one: 1, two: 2 }
await db.rows(...);
await db.query(...); // Any query, complex or irrelevant results.

// Tagged templates:
await db.value(pg.sql`select * from ${pg.raw('foos')} where id = ${id};`);

// Special symbols for tagged templates:
pg.default;
pg.now;
pg.raw('foo');
```

## License

MIT
