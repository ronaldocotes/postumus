require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

async function check() {
  try {
    const carnes = await pool.query('SELECT COUNT(*) FROM "Carne"');
    console.log('\n📊 CARNÊS NO BANCO:');
    console.log('   Total:', carnes.rows[0].count);
    
    if (carnes.rows[0].count > 0) {
      const list = await pool.query('SELECT id, "clientId", status, "createdAt" FROM "Carne" LIMIT 10');
      console.log('\n   Primeiros 10:');
      list.rows.forEach((c, i) => {
        console.log(`   ${i+1}. ID: ${c.id.substring(0, 8)}... | Cliente: ${c.clientId.substring(0, 8)}... | Status: ${c.status}`);
      });
    } else {
      console.log('\n   ⚠️  Nenhum carnê encontrado no banco!');
      console.log('\n   Clientes no banco:');
      const clients = await pool.query('SELECT id, name FROM "Client"');
      clients.rows.forEach((c, i) => {
        console.log(`   ${i+1}. ${c.name} (ID: ${c.id.substring(0, 8)}...)`);
      });
    }
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    pool.end();
  }
}

check();
