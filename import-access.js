const { default: MDBReader } = require("mdb-reader");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const fs = require("fs");

require('dotenv').config();
const { pgPoolConfig } = require('./src/lib/db-config');

const buffer = fs.readFileSync("C:\\Users\\sdcot\\Downloads\\FC - CenterPAX-DESKTOP-F14286F.accdb");
const reader = new MDBReader(buffer);

async function importWithBatches(client, items, fn, batchSize = 100, name = 'itens') {
  let count = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    try {
      await client.query('SAVEPOINT sp' + i);
      for (const item of batch) {
        await fn(item);
        count++;
      }
      await client.query('RELEASE SAVEPOINT sp' + i);
      console.log(`  ${name}: ${count}/${items.length} (${Math.round((i+batch.length)/items.length*100)}%)`);
    } catch (err) {
      await client.query('ROLLBACK TO SAVEPOINT sp' + i);
      console.warn(`⚠️ Batch ${Math.floor(i/batchSize)+1} falhou, retry...`, err.message);
      // Retry o batch
      for (const item of batch) {
        try {
          await fn(item);
          count++;
        } catch (retryErr) {
          console.warn(`  ❌ Skip ${name}:`, retryErr.message);
        }
      }
    }
  }
  return count;
}

async function run() {
  const pool = new Pool({ ...pgPoolConfig });
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Criar admin (transação única)
    const adminHash = await bcrypt.hash("admin123", 10);
    await client.query(`
      INSERT INTO "User" (id, name, email, password, role, active, "createdAt", "updatedAt")
      VALUES ('admin001', 'Administrador', 'admin@funeraria.com', $1, 'ADMIN', true, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, [adminHash]);
    console.log("✓ Admin criado");

    // 2. Importar funcionários (batch)
    const funcionarios = reader.getTable("Funcionários").getData();
    const funcMap = {};
    await importWithBatches(client, funcionarios, async (f) => {
      const id = `func-${f.IdFunc}`;
      const nome = (f.Nome || "").trim();
      if (!nome) return;
      const email = `func${f.IdFunc}@funeraria.com`;
      const hash = await bcrypt.hash("123456", 10);
      await client.query(`
        INSERT INTO "User" (id, name, email, password, role, active, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, 'COBRADOR', true, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
      `, [id, nome, email, hash]);
      funcMap[f.IdFunc] = id;
    }, 50, 'Funcionários');
    
    console.log(`✓ ${Object.keys(funcMap).length} funcionários importados`);
    const clientes = reader.getTable("Clientes").getData();
    const clientMap = {};
    let importedClients = 0;

    for (const c of clientes) {
      const id = `cli-${c.IdCliente}`;
      const code = c.Código ? String(c.Código) : null;
      const name = (c.Nome || "").trim();
      if (!name) continue;

      let cpf = (c.CPF || "").replace(/\D/g, "").trim();
      if (cpf.length < 11) cpf = null;

      const status = c.Cancelado ? "CANCELLED" : "ACTIVE";
      const active = !c.Cancelado;
      const dueDay = c.Vencimento ? parseInt(c.Vencimento) || 10 : 10;
      const payLoc = (c.LocalPagamento || "").toLowerCase().includes("loja") ? "LOJA" : "RESIDENCIA";

      let birthDate = null;
      if (c.Nascimento) {
        const d = new Date(c.Nascimento);
        if (!isNaN(d.getTime())) birthDate = d.toISOString();
      }

      let contractDate = null;
      if (c.DataContrato) {
        const d = new Date(c.DataContrato);
        if (!isNaN(d.getTime())) contractDate = d.toISOString();
      }

      let cancelDate = null;
      if (c.DataCancelamento) {
        const d = new Date(c.DataCancelamento);
        if (!isNaN(d.getTime())) cancelDate = d.toISOString();
      }

      await client.query(`
        INSERT INTO "Client" (
          id, code, name, cpf, rg, "birthDate", phone, cellphone, 
          address, neighborhood, city, state, "civilStatus", profession, workplace,
          "fatherName", "motherName", "spouseName", "dueDay", "paymentLocation",
          "contractDate", "cancelDate", status, notes, notes2, active, 
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26,
          NOW(), NOW()
        ) ON CONFLICT DO NOTHING
      `, [
        id, code, name, cpf, (c.RG || "").trim() || null, birthDate,
        (c.Fone || "").trim() || null, (c.Celular || "").trim() || null,
        (c.Endereço || "").trim() || null, (c.Bairro || "").trim() || null,
        (c.Cidade || "").trim() || null, (c.UF || "").trim() || null,
        (c.Est_Civil || "").trim() || null, (c.Profissão || "").trim() || null,
        (c["Local de Trabalho"] || "").trim() || null,
        (c.Pai || "").trim() || null, (c.Mãe || "").trim() || null,
        (c.Cônjuge || "").trim() || null, dueDay, payLoc,
        contractDate, cancelDate, status,
        (c.Observação || "").trim() || null, (c.Observação2 || "").trim() || null,
        active
      ]);

      clientMap[c.IdCliente] = id;
      importedClients++;

      // Importar dependentes
      const deps = [];
      const depText1 = (c.Dependentes || "").trim();
      const depText2 = (c.Dependentes2 || "").trim();
      if (depText1) deps.push(...depText1.split(/[;\n]/).map(d => d.trim()).filter(d => d));
      if (depText2) deps.push(...depText2.split(/[;\n]/).map(d => d.trim()).filter(d => d));

      for (let i = 0; i < deps.length; i++) {
        const depId = `dep-${c.IdCliente}-${i}`;
        await client.query(`
          INSERT INTO "Dependent" (id, "clientId", name, relationship, active, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, 'OUTRO', true, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [depId, id, deps[i]]);
      }
    }
    console.log(`✓ ${importedClients} clientes importados`);

    // 4. Importar pagamentos (agrupados como carnês por ano)
    const pagamentos = reader.getTable("Pagameto").getData();

    // Agrupar pagamentos por cliente+ano
    const carneGroups = {};
    for (const p of pagamentos) {
      if (!p.DataVenc || !clientMap[p.IdCliente]) continue;
      const d = new Date(p.DataVenc);
      if (isNaN(d.getTime())) continue;
      const year = d.getFullYear();
      const key = `${p.IdCliente}-${year}`;
      if (!carneGroups[key]) {
        carneGroups[key] = { clientId: clientMap[p.IdCliente], year, payments: [], totalValue: 0 };
      }
      carneGroups[key].payments.push(p);
      carneGroups[key].totalValue += Number(p.Valor) || 0;
    }

    let carneCount = 0;
    let paymentCount = 0;

    for (const [key, group] of Object.entries(carneGroups)) {
      const carneId = `carne-${key}`;
      await client.query(`
        INSERT INTO "Carne" (id, "clientId", year, "totalValue", installments, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [carneId, group.clientId, group.year, group.totalValue, group.payments.length]);
      carneCount++;

      for (const p of group.payments) {
        const payId = `pay-${key}-${p.N}`;
        const dueDate = new Date(p.DataVenc).toISOString();
        let paidAt = null;
        if (p.DataPgto) {
          const pd = new Date(p.DataPgto);
          if (!isNaN(pd.getTime())) paidAt = pd.toISOString();
        }
        const status = p.Pago ? "PAID" : "PENDING";
        const amount = Number(p.Valor) || 0;
        const receivedById = p.Func && funcMap[p.Func] ? funcMap[p.Func] : null;
        const payLoc = (p.LocalPGT || "").toLowerCase().includes("loja") ? "LOJA" : "RESIDENCIA";

        await client.query(`
          INSERT INTO "Payment" (
            id, "carneId", installment, "dueDate", amount, "paidAmount", "paidAt", 
            status, "paymentMethod", "paymentLocation", "receivedById", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [
          payId, carneId, p.N || 1, dueDate, amount,
          p.Pago ? amount : null, paidAt, status, 
          p.Pago ? "CASH" : null, payLoc, receivedById
        ]);
        paymentCount++;
      }

      if (carneCount % 100 === 0) process.stdout.write(`  Carnês: ${carneCount}...\r`);
    }

    await client.query("COMMIT");
    console.log(`\n✓ ${carneCount} carnês importados`);
    console.log(`✓ ${paymentCount} pagamentos importados`);
    console.log("\n🎉 Importação concluída com sucesso!");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("ERRO:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
