require('dotenv').config();
const { Pool } = require("pg");
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:1q@localhost:5432/funeraria",
});

async function resetUserPassword() {
  try {
    const email = 'admin@funeraria.com';
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await pool.query(
      'UPDATE "User" SET password = $1 WHERE email = $2 RETURNING email, name, role',
      [hashedPassword, email]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('\n✅ ACESSO AO SISTEMA:\n');
      console.log('   📧 Email: ' + user.email);
      console.log('   🔐 Senha: ' + newPassword);
      console.log('   👤 Usuário: ' + user.name);
      console.log('   🔑 Role: ' + user.role);
      console.log('\n   🌐 Acesse: http://localhost:3000\n');
    } else {
      console.log('❌ Usuário não encontrado');
    }
  } catch (error) {
    console.error("❌ ERRO:", error.message);
  } finally {
    await pool.end();
  }
}

resetUserPassword();
