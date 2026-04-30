require('dotenv').config();
const { Pool } = require("pg");
const { pgPoolConfig } = require("./src/lib/db-config");

const pool = new Pool(pgPoolConfig);

async function reset() {
  console.log("Resetting schema...");
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
  await pool.query('CREATE SCHEMA public');
  console.log("Done!");
  await pool.end();
}
reset().catch(console.error);
