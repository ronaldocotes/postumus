require('dotenv').config();
const { Pool } = require("pg");
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:1q@localhost:5432/funeraria",
});

async function checkUsers() {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM "User" ORDER BY "createdAt"');
    
    console.log('\n👥 USUÁRIOS CADASTRADOS:\n');
    if (result.rows.length === 0) {
      console.log('   ❌ Nenhum usuário encontrado!');
      console.log('\n   Criando usuário padrão...\n');
      await createDefaultUser();
    } else {
      result.rows.forEach((user, idx) => {
        console.log(`   ${idx + 1}. ${user.name}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Role: ${user.role}\n`);
      });
    }
  } catch (error) {
    console.error("❌ ERRO:", error.message);
  } finally {
    await pool.end();
  }
}

async function createDefaultUser() {
  const pool2 = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:1q@localhost:5432/funeraria",
  });
  
  try {
    const email = 'admin@funeraria.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool2.query(
      'INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())',
      ['Administrador', email, hashedPassword, 'ADMIN']
    );
    
    console.log('   ✅ Usuário criado com sucesso!\n');
    console.log('   📧 Email: ' + email);
    console.log('   🔐 Senha: ' + password);
    console.log('\n');
  } catch (error) {
    if (error.code === '23505') {
      console.log('   ℹ️  Usuário já existe\n');
    } else {
      console.error('   ❌ Erro:', error.message);
    }
  } finally {
    await pool2.end();
  }
}

checkUsers();
