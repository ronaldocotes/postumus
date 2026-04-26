const { Pool } = require("pg");
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_nw4axRiGgH0K@ep-winter-mountain-acangl3p.sa-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000,
});
console.log("Trying to connect...");
pool.query("SELECT 1 as test").then(r => {
  console.log("Connected!", r.rows);
  pool.end();
}).catch(e => {
  console.error("Failed:", e.message);
  pool.end();
});
