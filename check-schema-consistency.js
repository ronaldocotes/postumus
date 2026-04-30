require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:1q@localhost:5432/funeraria"
});

async function checkConsistency() {
  try {
    console.log("🔍 Verificando inconsistências no banco de dados...\n");

    // 1. Verificar tabelas existentes
    const tableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const tableResult = await pool.query(tableQuery);
    console.log("📋 Tabelas encontradas:");
    tableResult.rows.forEach(row => console.log(`   - ${row.table_name}`));

    // 2. Contar registros em cada tabela
    console.log("\n📊 Registros por tabela:");
    for (const row of tableResult.rows) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
      const count = parseInt(countResult.rows[0].count);
      console.log(`   ${row.table_name}: ${count} registros`);
    }

    // 3. Verificar colunas em tabelas críticas
    console.log("\n🔎 Columns na tabela 'User':");
    const userColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'User'
      ORDER BY ordinal_position;
    `);
    userColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '[NOT NULL]' : '[nullable]'}`);
    });

    // 4. Verificar referências foreignkey com problemas
    console.log("\n🔗 Foreign Keys:");
    const fkQuery = `
      SELECT constraint_name, table_name, column_name, referenced_table_name, referenced_column_name
      FROM information_schema.referential_constraints
      WHERE table_schema = 'public'
      LIMIT 20;
    `;
    try {
      const fkResult = await pool.query(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS referenced_table_name,
          ccu.column_name AS referenced_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        ORDER BY tc.table_name;
      `);
      
      if (fkResult.rows.length === 0) {
        console.log("   ⚠️  Nenhuma FK encontrada!");
      } else {
        fkResult.rows.forEach(fk => {
          console.log(`   ${fk.table_name}.${fk.column_name} → ${fk.referenced_table_name}.${fk.referenced_column_name}`);
        });
      }
    } catch (err) {
      console.log(`   ⚠️  Erro ao verificar FKs: ${err.message}`);
    }

    // 5. Verificar enums
    console.log("\n📝 Enums existentes:");
    const enumQuery = `
      SELECT typname, enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      ORDER BY typname, enumsortorder;
    `;
    try {
      const enumResult = await pool.query(enumQuery);
      const enums = {};
      enumResult.rows.forEach(row => {
        if (!enums[row.typname]) enums[row.typname] = [];
        enums[row.typname].push(row.enumlabel);
      });
      Object.entries(enums).forEach(([name, values]) => {
        console.log(`   ${name}: ${values.join(', ')}`);
      });
    } catch (err) {
      console.log(`   ⚠️  Erro ao verificar enums: ${err.message}`);
    }

    // 6. Verificar índices
    console.log("\n🔑 Índices (chaves únicas):");
    const indexQuery = `
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE '%_unique%' OR indexname LIKE '%_key%'
      ORDER BY tablename;
    `;
    try {
      const indexResult = await pool.query(`
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND (indexname LIKE '%_key' OR indexname LIKE '%_unique')
        ORDER BY tablename;
      `);
      if (indexResult.rows.length === 0) {
        console.log("   ⚠️  Nenhum índice único encontrado!");
      } else {
        indexResult.rows.forEach(idx => {
          console.log(`   ${idx.tablename}: ${idx.indexname}`);
        });
      }
    } catch (err) {
      console.log(`   ⚠️  Erro ao verificar índices: ${err.message}`);
    }

    // 7. Verificar problemas de órfãos (registros com FK inválida)
    console.log("\n⚠️  Verificando registros órfãos...");
    
    // Verificar Clients sem Cobrador válido
    const orphanClients = await pool.query(`
      SELECT COUNT(*) FROM "Client" 
      WHERE "cobradorId" IS NOT NULL 
      AND "cobradorId" NOT IN (SELECT id FROM "User")
    `);
    if (parseInt(orphanClients.rows[0].count) > 0) {
      console.log(`   ❌ ${orphanClients.rows[0].count} Clients com cobradorId inválido`);
    } else {
      console.log(`   ✅ Sem Clients órfãos`);
    }

    // Verificar Dependents sem Client
    const orphanDependents = await pool.query(`
      SELECT COUNT(*) FROM "Dependent" 
      WHERE "clientId" NOT IN (SELECT id FROM "Client")
    `);
    if (parseInt(orphanDependents.rows[0].count) > 0) {
      console.log(`   ❌ ${orphanDependents.rows[0].count} Dependents órfãos`);
    } else {
      console.log(`   ✅ Sem Dependents órfãos`);
    }

    console.log("\n✅ Verificação concluída!");

  } catch (error) {
    console.error("❌ ERRO:", error.message);
  } finally {
    await pool.end();
  }
}

checkConsistency();
