require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

async function seedCarnes() {
  try {
    console.log('\n📝 Criando carnês de teste...\n');
    
    // Buscar clientes
    const clients = await pool.query('SELECT id, name FROM "Client"');
    
    if (clients.rows.length === 0) {
      console.log('❌ Nenhum cliente encontrado!');
      return;
    }
    
    // Criar carnês para cada cliente
    let createdCount = 0;
    for (const client of clients.rows) {
      const year = 2026;
      const totalValue = Math.floor(Math.random() * 5000) + 1000; // 1000-6000
      
      // Inserir carnê
      const carneResult = await pool.query(`
        INSERT INTO "Carne" (id, "clientId", year, "totalValue", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
        RETURNING id
      `, [client.id, year, totalValue]);
      
      const carneId = carneResult.rows[0].id;
      
      // Criar 12 parcelas (1 por mês)
      for (let month = 1; month <= 12; month++) {
        const dueDate = new Date(2026, month - 1, 10);
        const monthValue = Math.floor(totalValue / 12);
        
        await pool.query(`
          INSERT INTO "Installment" (id, "carneId", numero, valor, "dueDate", status, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, 'PENDING', NOW(), NOW())
        `, [carneId, month, monthValue, dueDate]);
      }
      
      createdCount++;
      console.log(`✅ ${client.name}`);
      console.log(`   → Carnê ${createdCount} | Valor: R$ ${totalValue.toFixed(2)} | 12x R$ ${(totalValue/12).toFixed(2)}`);
    }
    
    console.log(`\n✅ ${createdCount} carnês criados com sucesso!\n`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

seedCarnes();
