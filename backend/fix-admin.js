require('dotenv').config();
const { sql } = require('./src/db/client');
async function fix() {
  const result = await sql`UPDATE users SET role = 'admin' WHERE email = 'priyanshu82711@gmail.com' RETURNING id, role`;
  console.log('Fixed:', result);
  process.exit(0);
}
fix();
