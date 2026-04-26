const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_nw4axRiGgH0K@ep-winter-mountain-acangl3p.sa-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000,
  statement_timeout: 120000,
});

async function run() {
  console.log("Connecting...");
  const client = await pool.connect();
  
  // Check current state
  const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
  console.log("Current tables:", tables.rows.map(r => r.tablename));

  if (tables.rows.length <= 1) {
    console.log("Schema is empty, applying migration...");
    const sql = fs.readFileSync(path.join(__dirname, "prisma", "migrations", "20260426025532_init_v2", "migration.sql"), "utf8");
    await client.query(sql);
    console.log("Migration applied!");

    // Create prisma migrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) NOT NULL PRIMARY KEY,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      )
    `);
    await client.query(`
      INSERT INTO "_prisma_migrations" ("id","checksum","finished_at","migration_name","applied_steps_count")
      VALUES (gen_random_uuid(), 'manual', now(), '20260426025532_init_v2', 1)
    `);
    console.log("Prisma migrations record created!");
  } else {
    console.log("Tables already exist, skipping migration.");
  }

  // Final check
  const final = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
  console.log("Final tables:", final.rows.map(r => r.tablename));

  client.release();
  await pool.end();
  console.log("Done!");
}

run().catch(e => { console.error("Error:", e.message); process.exit(1); });
