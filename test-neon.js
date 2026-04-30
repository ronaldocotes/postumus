require('dotenv').config();
const { Pool } = require("pg");
const { pgPoolConfig } = require("./src/lib/db-config");

const pool = new Pool(pgPoolConfig);
console.log("🔌 Testando conexão Neon...");
pool.query("SELECT 1 as test, version() as pg_version")
  .then(r => {
    console.log("✅ Neon conectado!", r.rows[0]);
    pool.end();
  })
  .catch(e => {
    console.error("❌ Falha:", e.message);
    process.exit(1);
  });
