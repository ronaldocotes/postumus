const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '1q',
  database: 'funeraria',
});

async function check() {
  try {
    const result = await pool.query('SELECT * FROM "Client"');
    console.log(`Total: ${result.rows.length}`);
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    pool.end();
  }
}

check();
