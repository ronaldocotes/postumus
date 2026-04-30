const { Pool } = require("pg");
const fs = require("fs");
require('dotenv').config();
const { Pool } = require("pg");
const { pgPoolConfig } = require("./src/lib/db-config");
const pool = new Pool(pgPoolConfig);

const log = (msg) => { console.log(msg); fs.appendFileSync("C:\\Users\\sdcot\\funeraria-system\\test-locks-out.txt", msg + "\n"); };

async function run() {
  log("Checking locks...");
  const locks = await pool.query("SELECT pid, state, query, wait_event_type, wait_event FROM pg_stat_activity WHERE datname = 'neondb' AND pid != pg_backend_pid()");
  log("Active connections: " + locks.rows.length);
  locks.rows.forEach(r => log(`  PID ${r.pid}: state=${r.state}, wait=${r.wait_event_type}/${r.wait_event}, query=${(r.query||"").substring(0,100)}`));

  // Terminate any idle-in-transaction
  for (const r of locks.rows) {
    if (r.state === 'idle in transaction') {
      log(`  Terminating PID ${r.pid}...`);
      await pool.query(`SELECT pg_terminate_backend(${r.pid})`);
    }
  }

  log("\nTrying INSERT via pool.query...");
  const t0 = Date.now();
  try {
    const r = await pool.query(`INSERT INTO "User" (id, name, email, password, role, active, "createdAt", "updatedAt") VALUES ('test1', 'Test', 'test@test.com', 'hash', 'ADMIN', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING`);
    log(`INSERT took ${Date.now()-t0}ms, rowCount=${r.rowCount}`);
    await pool.query(`DELETE FROM "User" WHERE id='test1'`);
    log("Cleanup done");
  } catch(e) {
    log("INSERT error: " + e.message);
  }
  
  await pool.end();
  log("DONE");
}
run().catch(e => { log("ERROR: " + e.message); process.exit(1); });
