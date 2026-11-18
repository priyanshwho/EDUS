const fs = require('node:fs');
const path = require('node:path');

function dependency(name) {
  return process.env.STUDY_TEST_DEPS_PATH ? require(path.join(process.env.STUDY_TEST_DEPS_PATH, name)) : require(name);
}

async function database() {
  const { PGlite } = dependency('@electric-sql/pglite');
  const { vector } = dependency('@electric-sql/pglite-pgvector');
  const db = new PGlite({ extensions: { vector } });
  await db.exec('CREATE TABLE users(id UUID PRIMARY KEY);');
  const migration = fs.readFileSync(path.join(__dirname, '../../drizzle/0001_private_study.sql'), 'utf8');
  await db.exec(migration);
  const adapt = engine => {
    const sql = async (strings, ...values) => {
      const query = strings.reduce((text, part, index) => text + (index ? `$${index}` : '') + part, '');
      return (await engine.query(query, values)).rows;
    };
    sql.unsafe = async (query, values = []) => (await engine.query(query, values)).rows;
    sql.begin = work => db.transaction(tx => work(adapt(tx)));
    return sql;
  };
  return { db, sql: adapt(db), close: () => db.close() };
}

module.exports = { database };
