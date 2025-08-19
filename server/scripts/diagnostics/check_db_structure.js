// Moved from root: check_db_structure.js
// Purpose: Print basic DB structure info

const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.POSTGRES_URL });
  await client.connect();
  try {
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;");
    console.log(res.rows.map(r => r.table_name).join('\n'));
  } finally {
    await client.end();
  }
})();
