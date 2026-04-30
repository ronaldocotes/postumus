require('dotenv').config();
const { Pool } = require("pg");
const { pgPoolConfig } = require("./src/lib/db-config");

const p = new Pool(pgPoolConfig);

async function run() {
  await p.query('ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION, ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION');
  console.log("Columns added!");
  await p.query(`INSERT INTO "_prisma_migrations" (id,checksum,"finished_at","migration_name","applied_steps_count") VALUES (gen_random_uuid(),'manual',now(),'20260426145646_add_client_coordinates',1)`);
  console.log("Migration recorded!");
  await p.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
