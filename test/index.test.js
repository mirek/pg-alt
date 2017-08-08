
// Requires:
// createdb pg-alt-test

const { expect } = require('chai');
const pg = require('../');

describe('pg-alt', function () {

  const db = pg('postgres://localhost/pg-alt-test');

  it('should get current date', async function () {
    expect(await db.value(pg.sql`select ${pg.now};`)).to.be.an('date');
  });

});
