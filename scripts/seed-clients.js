const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '1q',
  database: 'funeraria',
});

async function seed() {
  try {
    // Inserir clientes de teste
    const clients = [
      { name: 'João Silva', cpf: '12345678901', cellphone: '(96) 98123-4567', city: 'Macapá', neighborhood: 'Central', status: 'ACTIVE' },
      { name: 'Maria Santos', cpf: '23456789012', cellphone: '(96) 98234-5678', city: 'Macapá', neighborhood: 'Zerão', status: 'ACTIVE' },
      { name: 'Pedro Oliveira', cpf: '34567890123', cellphone: '(96) 98345-6789', city: 'Santana', neighborhood: 'Centro', status: 'ACTIVE' },
      { name: 'Ana Costa', cpf: '45678901234', cellphone: '(96) 98456-7890', city: 'Macapá', neighborhood: 'Jardim Felicidade', status: 'SUSPENDED' },
    ];

    for (const c of clients) {
      await pool.query(
        `INSERT INTO "Client" (id, name, cpf, cellphone, city, neighborhood, status, active, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, NOW(), NOW())
         ON CONFLICT (cpf) DO NOTHING`,
        [c.name, c.cpf, c.cellphone, c.city, c.neighborhood, c.status]
      );
    }

    const result = await pool.query('SELECT COUNT(*) as total FROM "Client"');
    console.log('Total de clientes após seed:', result.rows[0].total);
    
    const list = await pool.query('SELECT name, status FROM "Client"');
    console.log('\nClientes cadastrados:');
    list.rows.forEach(c => console.log('  ✓', c.name, '-', c.status));
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    pool.end();
  }
}

seed();
