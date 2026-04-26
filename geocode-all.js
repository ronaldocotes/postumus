const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_nw4axRiGgH0K@ep-winter-mountain-acangl3p.sa-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const { rows: clients } = await pool.query(`
    SELECT id, address, neighborhood, city, state 
    FROM "Client" 
    WHERE active = true AND latitude IS NULL AND address IS NOT NULL
    ORDER BY name
  `);
  
  console.log(`${clients.length} clientes sem coordenadas`);
  let ok = 0, fail = 0;

  for (let i = 0; i < clients.length; i++) {
    const c = clients[i];
    const parts = [c.address, c.neighborhood, c.city, c.state].filter(Boolean);
    if (parts.length === 0) { fail++; continue; }
    
    const query = encodeURIComponent(parts.join(", "));
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`,
        { headers: { "User-Agent": "Postumus-Funeraria/1.0" } }
      );
      const data = await res.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        await pool.query('UPDATE "Client" SET latitude=$1, longitude=$2 WHERE id=$3', [lat, lon, c.id]);
        ok++;
      } else {
        fail++;
      }
    } catch (e) {
      fail++;
    }
    
    if ((i + 1) % 10 === 0) console.log(`  ${i + 1}/${clients.length} (${ok} ok, ${fail} fail)`);
    
    // Nominatim rate limit: 1 req/sec
    await new Promise(r => setTimeout(r, 1100));
  }

  console.log(`\nDone! ${ok} geocoded, ${fail} failed`);
  
  // Stats
  const { rows: stats } = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(latitude) as with_coords,
      COUNT(*) - COUNT(latitude) as without_coords
    FROM "Client" WHERE active = true
  `);
  console.log("Stats:", stats[0]);
  
  await pool.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
