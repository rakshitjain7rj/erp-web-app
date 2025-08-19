# Server Scripts

Organized utilities for diagnostics, tests, ops, and dev workflows.

## Quick start
- Start server: `npm run server:start`
- Dev (nodemon): `npm run server:dev`
- Dev helper script: `npm run server:dev:start`

## Diagnostics
- Schema: `npm run server:diag:check-schema`
- Yarn column: `npm run server:diag:check-yarn-col`
- Find production: `npm run server:diag:find-production`
- Inspect structure: `npm run server:diag:inspect-structure`
- Verify ASU prod table: `npm run server:diag:test-asu-prod-table`

## Tests
- Routes: `npm run server:test:routes-load`
- APIs: `npm run server:test:api`
- Create entry: `npm run server:test:create-entry`
- Yarn summary (Unit 1): `npm run server:test:yarn-summary-u1`
- Duplicate guard: `npm run server:test:duplicate`
- Historical preservation: `npm run server:test:historical`
- Login + yarn type: `npm run server:test:login-yarn`
- Machine config changes: `npm run server:test:machine-config`
- Machine creation: `npm run server:test:machine-creation`
- Machine performance API: `npm run server:test:machine-performance`

## Ops
- Create admin: `npm run server:ops:create-admin`

## Migrations/guards
- Ensure ASU composite unique: `npm run server:fix:asu-unique`

Set environment variables (e.g., DB, API_TOKEN) in `server/.env` or root `.env` as your server expects.
