require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:1q@localhost:5432/funeraria"
});

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  try {
    // Hash de senhas
    const adminPassword = await bcrypt.hash('admin123', 10);
    const managerPassword = await bcrypt.hash('gerente123', 10);
    const collectorPassword = await bcrypt.hash('cobrador123', 10);

    // Limpar dados existentes
    console.log('🧹 Limpando dados anteriores...');
    await pool.query('DELETE FROM "Dependent"');
    await pool.query('DELETE FROM "Carne"');
    await pool.query('DELETE FROM "Client"');
    await pool.query('DELETE FROM "User"');
    await pool.query('DELETE FROM "Company"');
    console.log('✅ Limpeza concluída\n');

    // Criar Company
    console.log('🏢 Criando Company...');
    const companyRes = await pool.query(`
      INSERT INTO "Company" (id, name, "tradeName", cnpj, phone, email, address, city, state, "zipCode", "pixKeyType", "pixKey", "pixName", "pixCity", active, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'Postumus Funerária', 'Postumus', '12.345.678/0001-90', '(91) 3000-0000', 'contato@postumus.com.br', 'Avenida Equatorial, 1000', 'Macapá', 'AP', '68900-000', 'CPF', '12345678900', 'Postumus Funerária', 'Macapá', true, NOW(), NOW())
      RETURNING id
    `);
    const companyId = companyRes.rows[0].id;
    console.log('✅ Company criada\n');

    // Criar usuários
    console.log('👥 Criando usuários...');

    const usersRes = await pool.query(`
      INSERT INTO "User" (id, name, email, password, role, active, "createdAt", "updatedAt", pin, zone)
      VALUES 
        (gen_random_uuid(), 'Administrador', 'admin@postumus.com.br', $1, 'ADMIN', true, NOW(), NOW(), '1234', 'Central'),
        (gen_random_uuid(), 'Gerente Geral', 'gerente@postumus.com.br', $2, 'GERENTE', true, NOW(), NOW(), '5678', 'Central'),
        (gen_random_uuid(), 'Secretária', 'secretaria@postumus.com.br', $3, 'SECRETARIA', true, NOW(), NOW(), '9999', 'Central'),
        (gen_random_uuid(), 'Cobrador João', 'joao.cobrador@postumus.com.br', $4, 'COBRADOR', true, NOW(), NOW(), '1111', 'Zona Sul'),
        (gen_random_uuid(), 'Cobrador Maria', 'maria.cobrador@postumus.com.br', $5, 'COBRADOR', true, NOW(), NOW(), '2222', 'Zona Norte')
      RETURNING id, name, role
    `, [adminPassword, managerPassword, await bcrypt.hash('secretaria123', 10), collectorPassword, collectorPassword]);

    const cobradorJoao = usersRes.rows.find(u => u.name === 'Cobrador João').id;
    const cobradorMaria = usersRes.rows.find(u => u.name === 'Cobrador Maria').id;

    console.log('✅ Usuários criados\n');

    // Criar clientes com dependentes
    console.log('🤝 Criando Clientes com Dependentes...');

    const clientsData = [
      {
        code: 'CLI001',
        name: 'José da Silva Santos',
        cpf: '123.456.789-00',
        rg: '1.234.567',
        birthDate: '1980-05-15',
        phone: '3000-0001',
        cellphone: '(91) 98765-4321',
        email: 'jose.silva@email.com',
        address: 'Rua das Flores',
        number: '100',
        neighborhood: 'Centro',
        city: 'Macapá',
        state: 'AP',
        zipCode: '68900-000',
        status: 'ACTIVE',
        monthlyValue: 500,
        cobradorId: cobradorJoao,
        dependents: [
          { name: 'Maria Silva Santos', birthDate: '2005-03-10', relationship: 'FILHA', cpf: '111.222.333-00' },
          { name: 'João da Silva Neto', birthDate: '2008-07-22', relationship: 'FILHO', cpf: '111.222.333-01' }
        ]
      },
      {
        code: 'CLI002',
        name: 'Ana Clara Oliveira Costa',
        cpf: '987.654.321-00',
        rg: '7.654.321',
        birthDate: '1975-03-20',
        phone: '3000-0002',
        cellphone: '(91) 99876-5432',
        email: 'ana.clara@email.com',
        address: 'Avenida Principal',
        number: '200',
        neighborhood: 'Centro',
        city: 'Macapá',
        state: 'AP',
        zipCode: '68900-000',
        status: 'ACTIVE',
        monthlyValue: 750,
        cobradorId: cobradorMaria,
        dependents: [
          { name: 'Carlos Alberto Oliveira', birthDate: '1974-01-15', relationship: 'CONJUGE', cpf: '222.333.444-00' },
          { name: 'Pedro Oliveira Costa', birthDate: '1998-11-05', relationship: 'FILHO', cpf: '222.333.444-01' },
          { name: 'Luciana Oliveira Costa', birthDate: '2000-09-12', relationship: 'FILHA', cpf: '222.333.444-02' }
        ]
      },
      {
        code: 'CLI003',
        name: 'Roberto Ferreira Mendes',
        cpf: '456.789.123-00',
        rg: '4.567.890',
        birthDate: '1968-12-08',
        phone: '3000-0003',
        cellphone: '(91) 97777-1111',
        email: 'roberto.ferreira@email.com',
        address: 'Rua do Comércio',
        number: '350',
        neighborhood: 'Zona Norte',
        city: 'Macapá',
        state: 'AP',
        zipCode: '68900-100',
        status: 'ACTIVE',
        monthlyValue: 600,
        cobradorId: cobradorJoao,
        dependents: [
          { name: 'Fernanda Ferreira Mendes', birthDate: '1970-06-18', relationship: 'CONJUGE', cpf: '333.444.555-00' },
          { name: 'Beatriz Ferreira Mendes', birthDate: '1995-02-28', relationship: 'FILHA', cpf: '333.444.555-01' }
        ]
      },
      {
        code: 'CLI004',
        name: 'Carla Souza Ribeiro',
        cpf: '789.012.345-00',
        rg: '7.890.123',
        birthDate: '1982-07-14',
        phone: '3000-0004',
        cellphone: '(91) 98888-2222',
        email: 'carla.souza@email.com',
        address: 'Av. Brasil',
        number: '500',
        neighborhood: 'Zona Sul',
        city: 'Macapá',
        state: 'AP',
        zipCode: '68900-200',
        status: 'ACTIVE',
        monthlyValue: 800,
        cobradorId: cobradorMaria,
        dependents: [
          { name: 'Gustavo Souza Ribeiro', birthDate: '2006-04-30', relationship: 'FILHO', cpf: '444.555.666-00' },
          { name: 'Sophia Souza Ribeiro', birthDate: '2010-10-12', relationship: 'FILHA', cpf: '444.555.666-01' },
          { name: 'Juliana Ribeiro Silva', birthDate: '1985-05-22', relationship: 'IRMA', cpf: '444.555.666-02' }
        ]
      }
    ];

    for (const clientData of clientsData) {
      const clientRes = await pool.query(`
        INSERT INTO "Client" (
          id, code, name, cpf, rg, "birthDate", phone, cellphone, email, 
          address, number, neighborhood, city, state, "zipCode", status, 
          "monthlyValue", "cobradorId", active, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, true, NOW(), NOW()
        )
        RETURNING id
      `, [
        clientData.code, clientData.name, clientData.cpf, clientData.rg, 
        clientData.birthDate, clientData.phone, clientData.cellphone, clientData.email,
        clientData.address, clientData.number, clientData.neighborhood, 
        clientData.city, clientData.state, clientData.zipCode, 
        clientData.status, clientData.monthlyValue, clientData.cobradorId
      ]);

      const clientId = clientRes.rows[0].id;
      console.log(`✅ Cliente: ${clientData.name}`);

      // Inserir dependentes
      for (const dependent of clientData.dependents) {
        await pool.query(`
          INSERT INTO "Dependent" (id, "clientId", name, "birthDate", relationship, cpf, active, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW(), NOW())
        `, [clientId, dependent.name, dependent.birthDate, dependent.relationship, dependent.cpf]);
      }
      console.log(`   ├─ ${clientData.dependents.length} dependente(s) adicionado(s)`);
    }

    console.log('\n📋 Criando Carnês de exemplo...');

    // Buscar clientes para criar carnês
    const clientsRes = await pool.query(`
      SELECT id, "monthlyValue" FROM "Client" ORDER BY "createdAt" LIMIT 4
    `);

    for (const client of clientsRes.rows) {
      const carneRes = await pool.query(`
        INSERT INTO "Carne" (
          id, "clientId", year, "totalValue", description, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, 2026, $2, 'Plano anual 2026', NOW(), NOW()
        )
        RETURNING id
      `, [client.id, client.monthlyValue * 12]);

      const carneId = carneRes.rows[0].id;

      // Criar parcelas
      for (let i = 1; i <= 12; i++) {
        const dueDate = new Date(2026, i - 1, 15);
        await pool.query(`
          INSERT INTO "Installment" (
            id, "carneId", numero, valor, "dueDate", status, "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, 'PENDING', NOW(), NOW()
          )
        `, [carneId, i, client.monthlyValue, dueDate.toISOString()]);
      }

      console.log(`✅ Carnê criado com 12 parcelas`);
    }

    console.log('\n✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨');
    console.log('🎉 Seed concluído com sucesso!\n');
    console.log('📊 DADOS CRIADOS:');
    console.log('================================');
    console.log('👥 Usuários: 5 (Admin, Gerente, Secretária, 2 Cobradores)');
    console.log('🤝 Clientes: 4');
    console.log('👨‍👩‍👧‍👦 Dependentes: 11 (entre cônjuges, filhos e parentes)');
    console.log('📋 Carnês: 4 (com 12 parcelas cada)');
    console.log('================================\n');
    console.log('📝 CREDENCIAIS DE TESTE:');
    console.log('================================');
    console.log('🔴 ADMIN: admin@postumus.com.br / admin123');
    console.log('🔵 GERENTE: gerente@postumus.com.br / gerente123');
    console.log('🟢 SECRETÁRIA: secretaria@postumus.com.br / secretaria123');
    console.log('🟡 COBRADOR: joao.cobrador@postumus.com.br / cobrador123');
    console.log('================================\n');

  } catch (error) {
    console.error('❌ Erro durante seed:', error);
  } finally {
    await pool.end();
  }
}

seed();
