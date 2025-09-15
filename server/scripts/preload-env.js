#!/usr/bin/env node
/**
 * Preload production environment variables for CLI scripts (migrations, etc.).
 * Loads from, in order:
 *   1. .env.production.local
 *   2. .env.production
 * Supports both plain KEY=VALUE and lines prefixed with `export`.
 * Does NOT override variables already present in process.env.
 */
const fs = require('fs');
const path = require('path');

const candidates = [
  '.env.production.local',
  '.env.production'
];

function loadFile(p) {
  const full = path.join(process.cwd(), p);
  if (!fs.existsSync(full)) return false;
  const raw = fs.readFileSync(full, 'utf8');
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
    // Fallback simple parser for KEY=VALUE pairs
    raw.split(/\n+/).forEach(line => {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) {
        const [, k, v] = m;
        if (!process.env[k]) process.env[k] = v.replace(/^"|"$/g, '');
      }
    });
  }
  console.log(`[preload-env] Loaded ${p}`);
  return true;
}

for (const f of candidates) {
  loadFile(f);
}

// Minimal verification
if (!process.env.POSTGRES_URI && !process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  console.warn('[preload-env] No Postgres connection URL found after preload');
} else {
  const url = (process.env.POSTGRES_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL).replace(/:[^:@/]*@/, '://***@');
  console.log('[preload-env] Using DB URL (masked): %s', url);
}
