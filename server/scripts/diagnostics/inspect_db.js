// Moved from root: inspect_db.js
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.POSTGRES_URL });
  await client.connect();
  try {
    const res = await client.query('SELECT * FROM asu_machines ORDER BY unit, machine_no LIMIT 20');
    console.table(res.rows);
  } finally {
    await client.end();
  }
})();
