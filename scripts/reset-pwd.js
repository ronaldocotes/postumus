const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const pool = new Pool({ connectionString: 'postgresql://postgres:1q@localhost:5432/funeraria' });
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query('UPDATE "User" SET password = $1 WHERE email = $2', [hash, 'admin@postumus.com.br']);
  console.log('Senha resetada para admin123');
  
  // Verificar
  const r = await pool.query('SELECT email, password FROM "User" WHERE email = $1', ['admin@postumus.com.br']);
  const valid = await bcrypt.compare('admin123', r.rows[0].password);
  console.log('Senha valida:', valid);
  pool.end();
}

resetPassword();
