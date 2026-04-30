require('dotenv').config();
const { Pool } = require("pg");
const { pgPoolConfig } = require("./src/lib/db-config");
const pool = new Pool(pgPoolConfig);

async function run() {
  const client = await pool.connect();
  const counts = {};
  for (const t of ["User","Client","Dependent","Carne","Payment","Supplier","Product","FinancialTransaction"]) {
    const r = await client.query(`SELECT COUNT(*) FROM "${t}"`);
    counts[t] = parseInt(r.rows[0].count);
  }
  console.log("Row counts:", counts);
  client.release();
  await pool.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
