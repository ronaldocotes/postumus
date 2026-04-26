const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const p = new Pool({
  connectionString: "postgresql://neondb_owner:npg_nw4axRiGgH0K@ep-winter-mountain-acangl3p.sa-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
});
async function run() {
  const sql = fs.readFileSync(path.join(__dirname, "prisma", "migrations", "20260426150825_add_billing_address", "migration.sql"), "utf8");
  await p.query(sql);
  await p.query(`INSERT INTO "_prisma_migrations" (id,checksum,"finished_at","migration_name","applied_steps_count") VALUES (gen_random_uuid(),'manual',now(),'20260426150825_add_billing_address',1)`);
  console.log("OK");
  await p.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
