const { Pool } = require("pg");
const fs = require("fs");
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_nw4axRiGgH0K@ep-winter-mountain-acangl3p.sa-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});
const log = (msg) => { console.log(msg); fs.appendFileSync("C:\\Users\\sdcot\\funeraria-system\\cleanup-out.txt", msg + "\n"); };

async function run() {
  log("Terminating stale connections...");
  const locks = await pool.query("SELECT pid, state FROM pg_stat_activity WHERE datname='neondb' AND pid != pg_backend_pid() AND state = 'idle in transaction'");
  for (const r of locks.rows) {
    log(`  Killing PID ${r.pid}`);
    await pool.query(`SELECT pg_terminate_backend(${r.pid})`);
  }
  
  log("Cleaning tables...");
  await pool.query('DELETE FROM "Payment"');
  log("  Payment cleaned");
  await pool.query('DELETE FROM "Carne"');
  log("  Carne cleaned");
  await pool.query('DELETE FROM "Dependent"');
  log("  Dependent cleaned");
  await pool.query('DELETE FROM "Client"');
  log("  Client cleaned");
  await pool.query('DELETE FROM "User"');
  log("  User cleaned");
  await pool.query('DELETE FROM "FinancialTransaction"');
  log("  FinancialTransaction cleaned");
  
  // Verify
  for (const t of ["User","Client","Dependent","Carne","Payment"]) {
    const r = await pool.query(`SELECT COUNT(*) FROM "${t}"`);
    log(`  ${t}: ${r.rows[0].count}`);
  }
  
  await pool.end();
  log("CLEANUP DONE - ready for fresh import");
}
run().catch(e => { log("ERROR: " + e.message); process.exit(1); });
