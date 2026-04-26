const { Pool } = require("pg");

async function reset() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_nw4axRiGgH0K@ep-winter-mountain-acangl3p.sa-east-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false },
  });
  console.log("Resetting schema...");
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
  await pool.query('CREATE SCHEMA public');
  console.log("Done!");
  await pool.end();
}
reset().catch(console.error);
