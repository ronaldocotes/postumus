require('dotenv').config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:1q@localhost:5432/funeraria",
  connectionTimeoutMillis: 5000
});

async function verify() {
  try {
    console.log("🔌 Conectando ao PostgreSQL local...");
    const result = await pool.query("SELECT version();");
    console.log("✅ CONECTADO COM SUCESSO!");
    console.log("📊 PostgreSQL:", result.rows[0].version.split(',')[0]);
    
    // Contar registros
    const tables = ["User", "Client", "Product", "Payment", "Supplier", "Dependent", "Carne", "FinancialTransaction"];
    const counts = {};
    
    for (const table of tables) {
      const r = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
      counts[table] = parseInt(r.rows[0].count);
    }
    
    console.log("\n📈 Registros por tabela:");
    for (const [table, count] of Object.entries(counts)) {
      console.log(`   ${table}: ${count} registros`);
    }
    
  } catch (error) {
    console.error("❌ ERRO:", error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error("   → PostgreSQL não está respondendo em localhost:5432");
    } else if (error.code === '3D000') {
      console.error("   → Banco de dados 'funeraria' não existe");
    }
  } finally {
    await pool.end();
  }
}

verify();
