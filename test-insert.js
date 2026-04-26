const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_nw4axRiGgH0K@ep-winter-mountain-acangl3p.sa-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

async function run() {
  console.log("1. Connecting...");
  const client = await pool.connect();
  console.log("2. Connected, hashing...");
  const hash = await bcrypt.hash("admin123", 10);
  console.log("3. Hashed, inserting admin...");
  await client.query(`
    INSERT INTO "User" (id, name, email, password, role, active, "createdAt", "updatedAt")
    VALUES ('admin001', 'Administrador', 'admin@funeraria.com', $1, 'ADMIN', true, NOW(), NOW())
    ON CONFLICT (email) DO NOTHING
  `, [hash]);
  console.log("4. Admin inserted!");
  const r = await client.query('SELECT COUNT(*) FROM "User"');
  console.log("5. User count:", r.rows[0].count);
  client.release();
  await pool.end();
  console.log("6. Done!");
}
run().catch(e => { console.error("ERROR:", e.message); process.exit(1); });
