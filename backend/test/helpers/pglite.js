const path = require('node:path');
const { migrateStudy } = require('../../scripts/migrate-study');

function dependency(name) {
  return process.env.STUDY_TEST_DEPS_PATH ? require(path.join(process.env.STUDY_TEST_DEPS_PATH, name)) : require(name);
}

async function database() {
  const { PGlite } = dependency('@electric-sql/pglite');
  const { vector } = dependency('@electric-sql/pglite-pgvector');
  const db = new PGlite({ extensions: { vector } });
  await db.exec('CREATE TABLE users(id UUID PRIMARY KEY);');
  const adapt = engine => {
    const sql = async (strings, ...values) => {
      const query = strings.reduce((text, part, index) => text + (index ? `$${index}` : '') + part, '');
      return (await engine.query(query, values)).rows;
    };
    sql.unsafe = async (query, values = []) => {
      // postgres.js unsafe parameters have no inferred timestamp serializer.
      if (values.some(value => value instanceof Date)) throw new TypeError('Serialize raw timestamp parameters as ISO strings.');
      return values.length ? (await engine.query(query, values)).rows : (await engine.exec(query)).at(-1).rows;
    };
    sql.begin = work => db.transaction(tx => work(adapt(tx)));
    return sql;
  };
  const sql = adapt(db);
  await migrateStudy(sql);
  return { db, sql, close: () => db.close() };
}

module.exports = { database };
