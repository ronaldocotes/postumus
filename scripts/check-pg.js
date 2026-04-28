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
    const result = await pool.query('SELECT COUNT(*) as total FROM "Client"');
    console.log('Total de clientes:', result.rows[0].total);
    
    const clients = await pool.query('SELECT id, name, status, active FROM "Client" LIMIT 5');
    console.log('\nClientes:');
    clients.rows.forEach(c => console.log('  -', c.name, '(status:', c.status, ', active:', c.active, ')'));
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    pool.end();
  }
}

check();
