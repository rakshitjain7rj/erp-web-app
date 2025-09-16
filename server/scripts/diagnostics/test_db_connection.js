#!/usr/bin/env node
/**
 * Postgres/Neon connectivity diagnostic
 * Features:
 *  - Auto-load .env.production.local if present and core vars missing
 *  - Mask credentials in output
 *  - Show parsed components (host, port, database, search params)
 *  - Test SSL object (rejectUnauthorized:false)
 *  - Optional test with simple boolean SSL if PG_FORCE_SIMPLE_SSL=1
 *  - Optional fallback non-SSL test if ALLOW_FALLBACK=1
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenvLocalPath = path.join(process.cwd(), '.env.production.local');
const dotenvProdPath = path.join(process.cwd(), '.env.production');

function loadDotEnvFile(p) {
  try {
    // If file uses plain KEY=VALUE lines dotenv handles it
    const raw = fs.readFileSync(p, 'utf8');
    const hasExport = /^export\s+/m.test(raw);
    if (hasExport) {
      raw.split(/\n+/).forEach(line => {
        const m = line.match(/^export\s+([A-Z0-9_]+)=("?)(.*)\2$/);
        if (m) {
          const [, k,, v] = m;
            if (!process.env[k]) process.env[k] = v;
        }
      });
    } else {
      require('dotenv').config({ path: p });
    }
    return true;
  } catch(_) { return false; }
}

function autoLoadEnv() {
  if (!(process.env.POSTGRES_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL)) {
    if (fs.existsSync(dotenvLocalPath) && loadDotEnvFile(dotenvLocalPath)) {
      if (process.env.POSTGRES_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL) {
        console.log('[Diag] Loaded environment from .env.production.local');
        return;
      }
    }
    if (fs.existsSync(dotenvProdPath) && loadDotEnvFile(dotenvProdPath)) {
      if (process.env.POSTGRES_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL) {
        console.log('[Diag] Loaded environment from .env.production');
      }
    }
  }
}

autoLoadEnv();

const rawConn = process.env.POSTGRES_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!rawConn) {
  console.error('Missing POSTGRES_URI/POSTGRES_URL/DATABASE_URL');
  process.exit(1);
}

// Clean potential double prefix typos
const conn = rawConn.replace(/^postgresql:\/\/postgres:\/\//, 'postgresql://');

function mask(u) { return u.replace(/:[^:@/]*@/, '://***@'); }

let parsed;
try { parsed = new URL(conn); } catch(err) { console.warn('[Diag] Could not parse URL:', err.message); }

console.log('[Diag] Connection URL (masked): %s', mask(conn));
if (parsed) {
  console.log('[Diag] Host=%s Port=%s DB=%s Params=%s', parsed.hostname, parsed.port || '(default)', parsed.pathname.replace('/', ''), parsed.searchParams.toString() || '(none)');
  if (/localhost|127\.0\.0\.1/.test(parsed.hostname)) {
    console.warn('[Diag] WARNING: Host is localhost; Neon should be a remote hostname.');
  }
  if (!/sslmode=require/.test(parsed.search)) {
    console.warn('[Diag] NOTE: sslmode=require not present in query string; relying on dialectOptions / client options.');
  }
}

async function tryConnect(label, ssl) {
  const start = Date.now();
  const client = new Client({ connectionString: conn, ssl });
  try {
    await client.connect();
    const { rows } = await client.query('select current_database() as db, version()');
    console.log(`[OK] ${label} connected in ${Date.now()-start}ms db=${rows[0].db}`);
    await client.end();
    return { ok: true };
  } catch (err) {
    console.error(`[FAIL] ${label} -> ${err.message}`);
    if (err.code) console.error(`       code=${err.code}`);
    if (err.stack) console.error(err.stack.split('\n')[0]);
    return { ok: false, err };
  }
}

(async () => {
  console.log('\n[Diag] 1) Testing SSL object (rejectUnauthorized:false)');
  const r1 = await tryConnect('ssl-object', { rejectUnauthorized: false });

  if (process.env.PG_FORCE_SIMPLE_SSL === '1') {
    console.log('\n[Diag] 2) Testing simple boolean SSL (true) because PG_FORCE_SIMPLE_SSL=1');
    await tryConnect('ssl-boolean', true);
  }

  if (!r1.ok && process.env.ALLOW_FALLBACK === '1') {
    console.log('\n[Diag] 3) Fallback non-SSL test (ALLOW_FALLBACK=1)');
    await tryConnect('no-ssl', false);
  }
})();
