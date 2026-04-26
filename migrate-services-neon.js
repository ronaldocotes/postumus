const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_nw4axRiGgH0K@ep-winter-mountain-acangl3p.sa-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

async function run() {
  console.log("Applying services migration to Neon...");
  const sql = fs.readFileSync(path.join(__dirname, "prisma", "migrations", "20260426144300_add_services", "migration.sql"), "utf8");
  await pool.query(sql);
  console.log("Migration applied!");

  await pool.query(`
    INSERT INTO "_prisma_migrations" ("id","checksum","finished_at","migration_name","applied_steps_count")
    VALUES (gen_random_uuid(), 'manual', now(), '20260426144300_add_services', 1)
  `);
  console.log("Migration record created!");

  const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('Service','ServiceSale')");
  console.log("Tables:", tables.rows.map(r => r.tablename));

  await pool.end();
  console.log("Done!");
}
run().catch(e => { console.error("Error:", e.message); process.exit(1); });
