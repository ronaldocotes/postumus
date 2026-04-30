require('dotenv').config();
const { default: MDBReader } = require("mdb-reader");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const { pgPoolConfig } = require("./src/lib/db-config");

console.log("Target:", process.env.DATABASE_URL ? process.env.DATABASE_URL.split("@")[1] : "Local/Env DB");

const pool = new Pool(pgPoolConfig);

const buffer = fs.readFileSync("C:\\Users\\sdcot\\Downloads\\FC - CenterPAX-DESKTOP-F14286F.accdb");
const reader = new MDBReader(buffer);
console.log("Access DB loaded");

async function batchInsert(client, sql, paramSets, batchSize = 50) {
  for (let i = 0; i < paramSets.length; i += batchSize) {
    const batch = paramSets.slice(i, i + batchSize);
    for (const params of batch) {
      await client.query(sql, params);
    }
    if (i % 500 === 0 && i > 0) process.stdout.write(`  ${i}/${paramSets.length}\r`);
  }
}

async function run() {
  const client = await pool.connect();
  console.log("Connected!");

  // Use savepoints instead of one huge transaction
  await client.query("BEGIN");

  // 1. Admin
  const adminHash = await bcrypt.hash("admin123", 10);
  await client.query(`
    INSERT INTO "User" (id, name, email, password, role, active, "createdAt", "updatedAt")
    VALUES ('admin001', 'Administrador', 'admin@funeraria.com', $1, 'ADMIN', true, NOW(), NOW())
    ON CONFLICT (email) DO NOTHING
  `, [adminHash]);
  console.log("Admin OK");

  // 2. Employees
  const funcionarios = reader.getTable("Funcionários").getData();
  const funcMap = {};
  const hash = await bcrypt.hash("123456", 10);
  for (const f of funcionarios) {
    const id = `func-${f.IdFunc}`;
    const nome = (f.Nome || "").trim();
    if (!nome) continue;
    await client.query(`
      INSERT INTO "User" (id, name, email, password, role, active, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'COBRADOR', true, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, [id, nome, `func${f.IdFunc}@funeraria.com`, hash]);
    funcMap[f.IdFunc] = id;
  }
  console.log(`${Object.keys(funcMap).length} employees OK`);

  await client.query("COMMIT");

  // 3. Clients (in batches of 50)
  const clientes = reader.getTable("Clientes").getData();
  const clientMap = {};
  let cliCount = 0;

  for (let i = 0; i < clientes.length; i += 50) {
    await client.query("BEGIN");
    const batch = clientes.slice(i, i + 50);
    for (const c of batch) {
      const id = `cli-${c.IdCliente}`;
      const name = (c.Nome || "").trim();
      if (!name) continue;

      let cpf = (c.CPF || "").replace(/\D/g, "").trim();
      if (cpf.length < 11) cpf = null;

      const status = c.Cancelado ? "CANCELLED" : "ACTIVE";
      const dueDay = c.Vencimento ? parseInt(c.Vencimento) || 10 : 10;
      const payLoc = (c.LocalPagamento || "").toLowerCase().includes("loja") ? "LOJA" : "RESIDENCIA";

      const parseDate = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString(); };

      await client.query(`
        INSERT INTO "Client" (
          id, code, name, cpf, rg, "birthDate", phone, cellphone,
          address, neighborhood, city, state, "civilStatus", profession, workplace,
          "fatherName", "motherName", "spouseName", "dueDay", "paymentLocation",
          "contractDate", "cancelDate", status, notes, notes2, active,
          "createdAt", "updatedAt"
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,NOW(),NOW()
        ) ON CONFLICT DO NOTHING
      `, [
        id, c.Código ? String(c.Código) : null, name, cpf, (c.RG||"").trim()||null,
        parseDate(c.Nascimento), (c.Fone||"").trim()||null, (c.Celular||"").trim()||null,
        (c.Endereço||"").trim()||null, (c.Bairro||"").trim()||null,
        (c.Cidade||"").trim()||null, (c.UF||"").trim()||null,
        (c.Est_Civil||"").trim()||null, (c.Profissão||"").trim()||null,
        (c["Local de Trabalho"]||"").trim()||null,
        (c.Pai||"").trim()||null, (c.Mãe||"").trim()||null,
        (c.Cônjuge||"").trim()||null, dueDay, payLoc,
        parseDate(c.DataContrato), parseDate(c.DataCancelamento),
        status, (c.Observação||"").trim()||null, (c.Observação2||"").trim()||null, !c.Cancelado
      ]);

      clientMap[c.IdCliente] = id;
      cliCount++;

      // Dependents
      const deps = [];
      const d1 = (c.Dependentes || "").trim();
      const d2 = (c.Dependentes2 || "").trim();
      if (d1) deps.push(...d1.split(/[;\n]/).map(d => d.trim()).filter(d => d));
      if (d2) deps.push(...d2.split(/[;\n]/).map(d => d.trim()).filter(d => d));
      for (let j = 0; j < deps.length; j++) {
        await client.query(`
          INSERT INTO "Dependent" (id, "clientId", name, relationship, active, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, 'OUTRO', true, NOW(), NOW()) ON CONFLICT DO NOTHING
        `, [`dep-${c.IdCliente}-${j}`, id, deps[j]]);
      }
    }
    await client.query("COMMIT");
  }
  console.log(`${cliCount} clients OK`);

  // 4. Payments (grouped as carnês, committed in batches)
  const pagamentos = reader.getTable("Pagameto").getData();
  const carneGroups = {};
  for (const p of pagamentos) {
    if (!p.DataVenc || !clientMap[p.IdCliente]) continue;
    const d = new Date(p.DataVenc);
    if (isNaN(d.getTime())) continue;
    const year = d.getFullYear();
    const key = `${p.IdCliente}-${year}`;
    if (!carneGroups[key]) carneGroups[key] = { clientId: clientMap[p.IdCliente], year, payments: [], totalValue: 0 };
    carneGroups[key].payments.push(p);
    carneGroups[key].totalValue += Number(p.Valor) || 0;
  }

  const entries = Object.entries(carneGroups);
  let carneCount = 0, payCount = 0;

  for (let i = 0; i < entries.length; i += 20) {
    await client.query("BEGIN");
    const batch = entries.slice(i, i + 20);
    for (const [key, group] of batch) {
      const carneId = `carne-${key}`;
      await client.query(`
        INSERT INTO "Carne" (id, "clientId", year, "totalValue", installments, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) ON CONFLICT DO NOTHING
      `, [carneId, group.clientId, group.year, group.totalValue, group.payments.length]);
      carneCount++;

      for (const p of group.payments) {
        const dueDate = new Date(p.DataVenc).toISOString();
        let paidAt = null;
        if (p.DataPgto) { const pd = new Date(p.DataPgto); if (!isNaN(pd.getTime())) paidAt = pd.toISOString(); }
        const receivedById = p.Func && funcMap[p.Func] ? funcMap[p.Func] : null;
        const payLoc = (p.LocalPGT || "").toLowerCase().includes("loja") ? "LOJA" : "RESIDENCIA";

        await client.query(`
          INSERT INTO "Payment" (
            id, "carneId", installment, "dueDate", amount, "paidAmount", "paidAt",
            status, "paymentMethod", "paymentLocation", "receivedById", "createdAt", "updatedAt"
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW()) ON CONFLICT DO NOTHING
        `, [
          `pay-${key}-${p.N}`, carneId, p.N || 1, dueDate, Number(p.Valor) || 0,
          p.Pago ? Number(p.Valor) || 0 : null, paidAt, p.Pago ? "PAID" : "PENDING",
          p.Pago ? "CASH" : null, payLoc, receivedById
        ]);
        payCount++;
      }
    }
    await client.query("COMMIT");
    if (i % 100 === 0) console.log(`  Carnês: ${carneCount}, Payments: ${payCount}`);
  }

  console.log(`\n${carneCount} carnês, ${payCount} payments imported!`);

  // Verify
  for (const t of ["User","Client","Dependent","Carne","Payment"]) {
    const r = await client.query(`SELECT COUNT(*) FROM "${t}"`);
    console.log(`  ${t}: ${r.rows[0].count}`);
  }

  client.release();
  await pool.end();
  console.log("\nDONE!");
}

run().catch(e => { console.error("ERRO:", e.message); process.exit(1); });
