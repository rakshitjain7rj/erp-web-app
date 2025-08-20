#!/usr/bin/env node
/*
 * Safe repo cleanup: moves redundant root-level files into .trash/<timestamp>/
 * Organized canonical copies live under server/sql, server/scripts, and docs.
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../../');
const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, '-');
const trashBase = path.join(repoRoot, '.trash', `cleanup-${stamp}`);

// List of root files to move (relative to repo root)
const files = [
  // Docs duplicated at root
  'ASU_YARN_SUMMARY_FUNCTIONALITY_COMPLETE.md',
  'CLEANUP_SUMMARY.md',
  'DATABASE_SCHEMA_FIX.md',
  'DUPLICATE_FEATURE_SUMMARY.md',
  'EFFICIENCY_CALCULATION.md',
  'INVENTORY_REMARKS_SOLUTION.md',
  'MACHINE_CONFIGURATIONS_README.md',
  'MACHINE_CONFIG_FIX_COMPLETE.md',
  'MACHINE_CONFIG_WORKAROUND.md',
  'PRODUCTION_100_FIX.md',
  'PRODUCTION_100_REMOVAL.md',
  'YARN_TYPE_IMPLEMENTATION_SUCCESS.md',
  'YARN_TYPE_TRACKING_SOLUTION.md',

  // SQL migrations/diagnostics at root (organized copies exist)
  'add_extra_hours_column.sql',
  'add_inventory_fields_migration.sql',
  'add_machine_configurations_table.sql',
  'add_machine_name_column.sql',
  'add_production_at_100_to_entries.sql',
  'add_yarn_type_migration.sql',
  'add_yarn_type_to_production_entries.sql',
  'asu_indexes_and_data.sql',
  'asu_machines_migration.sql',
  'asu_production_entries_enhanced.sql',
  'asu_unit1_migration.sql',
  'check_asu_tables.sql',
  'complete_asu_migration.sql',
  'database_verification.sql',
  'fix_asu_production_table.sql',
  'fix_users_table.sql',
  'migration_asu_tables.sql',
  'migration_dyeing_records_fix.sql',
  'neon_asu_migration.sql',
  'neon_migration.sql',
  'safe_asu_migration.sql',
  'step_by_step_asu_tables.sql',

  // Root scripts superseded by server/scripts
  'analyze_tags.js',
  'apply_asu_unit_unique_fix.js',
  'apply_machine_config_migration.sh',
  'apply_yarn_type_solution.sh',
  'check_db_structure.js',
  'check_yarn_type_column.js',
  'inspect_db.js',
  'run_archive_fields_migration.js',
  'run_migration.js',
  'sync-database.js',
  'syncModels.js',
  'sync_machine_configurations.js',
  'test-asu-models.js',
  'test-party-api.js',
  'test_api_endpoints.js',
  'test_archive_api.js',
  'test_complete_archive.js',
  'test_data.js',
  'test_download_delete.js',
  'test_party_api.js',
  'test_party_post.js',
  'test_yarn_type.js',
  'verify_asu_tables.js',
  'verify_select_fix.js',

  // HTML testers
  'api_tester.html',
  'test_api.html',

  // Windows helpers (non-Linux)
  'restart_server.bat',
  'verify_fix.bat',

  // Stray prototype
  'add_efficiency_column_migration.js',
  // Remaining stray root scripts (have organized copies under server/scripts/migrations/legacy)
  'fix_asu_table.js',
  'fix_asu_unit_issue.js'
];

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function moveFile(rel) {
  const src = path.join(repoRoot, rel);
  if (!fs.existsSync(src)) return { rel, status: 'skip', reason: 'not-found' };
  const dest = path.join(trashBase, rel);
  ensureDir(path.dirname(dest));
  fs.renameSync(src, dest);
  return { rel, status: 'moved', dest };
}

function main() {
  console.log('Repo cleanup started');
  console.log('Repo root:', repoRoot);
  console.log('Trash dir:', trashBase);
  ensureDir(trashBase);

  const results = files.map(moveFile);
  const moved = results.filter(r => r.status === 'moved');
  const skipped = results.filter(r => r.status === 'skip');

  console.log(`Moved: ${moved.length}`);
  moved.forEach(r => console.log('  ->', r.rel));
  console.log(`Skipped (not found): ${skipped.length}`);
  if (skipped.length) skipped.forEach(r => console.log('  ..', r.rel));

  console.log('Cleanup complete.');
}

main();
