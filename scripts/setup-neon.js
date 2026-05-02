const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const pool = new Pool({ 
    connectionString: 'postgresql://neondb_owner:npg_Vmr5TES1DIfX@ep-rapid-rain-achydlzo-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
  });
  
  const hash = await bcrypt.hash('admin123', 10);
  
  // Verificar se já existe
  const existing = await pool.query('SELECT id FROM "User" WHERE email = $1', ['admin@postumus.com.br']);
  
  if (existing.rows.length > 0) {
    // Atualizar senha
    await pool.query('UPDATE "User" SET password = $1, active = true WHERE email = $2', [hash, 'admin@postumus.com.br']);
    console.log('Senha atualizada para admin@postumus.com.br');
  } else {
    // Criar
    await pool.query(
      'INSERT INTO "User" (id, name, email, password, role, active, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())',
      ['Administrador', 'admin@postumus.com.br', hash, 'ADMIN']
    );
    console.log('Usuário admin criado: admin@postumus.com.br / admin123');
  }
  
  // Listar usuarios
  const users = await pool.query('SELECT name, email, role, active FROM "User"');
  console.log('\nUsuários no banco Neon:');
  users.rows.forEach(u => console.log(`  - ${u.name} (${u.email}) [${u.role}] ${u.active ? 'Ativo' : 'Inativo'}`));
  
  pool.end();
}

createAdmin().catch(console.error);
