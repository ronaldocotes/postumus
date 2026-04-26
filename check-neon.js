const { Pool } = require("pg");
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_nw4axRiGgH0K@ep-winter-mountain-acangl3p.sa-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000,
});

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
