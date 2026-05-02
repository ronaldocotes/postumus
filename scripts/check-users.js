const { Pool } = require('pg');
const p = new Pool({ connectionString: 'postgresql://postgres:1q@localhost:5432/funeraria' });
p.query('SELECT id, name, email, active, role FROM "User"')
  .then(r => { console.log(JSON.stringify(r.rows, null, 2)); p.end(); })
  .catch(e => { console.error(e.message); p.end(); });
