
const url = require('url');
const _ = require('lodash');
const pg = require('pg');

// Map row's under_score keys into js camelCase.
function camelCase(a) {
  if (_.isObject(a)) {
    return _.mapKeys(a, (v, k) => _.camelCase(k));
  }
  return a;
}

// Transparently handles pg.sql`...` style templates.
function demangle(args) {
  if (args.length === 1) {
    const arg = args[0];
    if (_.isArray(arg) && _.isString(arg[0]) && _.isArray(arg[1])) {
      return arg;
    }
  }
  return args;
}

// Quick'n'dirty `postgres://user:pass@host:port/db?ssl=true` parser.
function parse(url_) {
  const params = url.parse(url_, true);
  const auth = params.auth ? params.auth.split(':') : null;
  return {
    user: auth ? auth[0] : null,
    password: auth ? auth[1] : null,
    host: params.hostname,
    port: params.port,
    database: params.pathname.split('/')[1],
    ssl: _.get(params, 'query.ssl')
  };
}

class Db {

  constructor(url) {
    this.pool = new pg.Pool(parse(url));
  }

  async query(...args) {
    return await this.pool.query(...demangle(args));
  }

  // Get rows from query result.
  async rows(...args) {
    const r = await this.query(...args);
    return _.has(r, 'rows') ? r.rows.map(camelCase) : [];
  }

  // Get single row from query result.
  async row(...args) {
    const r = await this.query(...args);
    if (_.get(r, 'rowCount') > 0) {
      return camelCase(r.rows[0]);
    }
    return null;
  }

  // Get single value from query result.
  async value(...args) {
    const r = await this.query(...args);
    if (_.get(r, 'rowCount') > 0) {
      return r.rows[0][r.fields[0].name];
    }
    return null;
  }

  async close() {
    await this.pool.end();
  }

}

// Symbols.
const S = {
  default: Symbol('DEFAULT'),
  now: Symbol('NOW()'),
  raw: Symbol('RAW')
};

// Template tag pg.sql`select ${pg.now}, * from ${pg.raw('foos')} where id = ${id};`.
function sql(as, ...bs) {
  const xs = [as[0]];
  const ys = [];
  const n = bs.length;
  let j = 0;
  for (let i = 0; i < n; i++) {
    const a = as[i + 1];
    const b = bs[i];
    switch (true) {
      case b === S.default:
        xs.push('DEFAULT');
        break;
      case b === S.now:
        xs.push('NOW()');
        break;
      case Array.isArray(b) && b[0] === S.raw:
        xs.push(b[1]);
        break;
      default:
        xs.push(`$${++j}`);
        ys.push(b);
    }
    xs.push(a);
  }
  return [
    xs.join(''),
    ys
  ];
}

function raw(x) {
  return [S.raw, x];
}

module.exports = Object.assign(
  function (...args) {
    return new Db(...args);
  }, {
    S,
    default: S.default,
    now: S.now,
    raw,
    sql,
    Db
  }
);
