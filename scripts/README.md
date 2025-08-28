Scripts directory structure
=================================

Purpose: Consolidate all ad-hoc operational, migration, debug, and test scripts that previously lived in the repository root.

Subfolders:

* migrations/  - One-off or incremental migration scripts (SQL + JS runners)
* db/          - Database inspection utilities (read-only or data verification)
* debug/       - Temporary / exploratory debugging helpers (non-production)
* tests/       - Manual / scripted integration or API tests (not part of automated test runner yet)
* auth/        - User creation / auth diagnostic scripts
* playground/  - Standalone HTML or quick experiment pages opened directly in a browser
* start/       - Startup helpers / local environment boot scripts
* maintenance/ - Repo / environment safety scripts (e.g., safe-pull) and recurring maintenance tasks
* archive/     - Old emergency/quick-fix scripts kept for historical reference; candidates for deletion after validation window

Conventions:
* Prefer descriptive filenames with hyphens.
* Add a short header comment at top describing intent, expected environment vars, and safety (read-only vs writes data).
* If a script supersedes an archived one, cross-reference it.

Housekeeping:
* Periodically prune archive/ after >30 days inactivity.
* Promote any stable useful script into an npm script and document in root README.
