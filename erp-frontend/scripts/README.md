ERP Frontend Scripts & Archive
================================

Purpose: Collect non-runtime artifacts (one-off fixes, mappers, PS scripts for Windows teammate, backups, experimental variants) outside of main source tree so `src/` stays lean.

Subfolders:
* archive/  - Old component/page/API variants retained temporarily.
* mappers/  - Mapping helper snapshots (txt/js/ts) used to transform or preserve data structures during migrations.
* windows/  - PowerShell (*.ps1) scripts required by Windows contributors.
* temp/     - Short-lived scratch or comparison files (should be empty before release tags).

Conventions:
* Prefer NOT committing new backups like `file.ts.new`; instead use git branches or stash.
* When replacing a component, move the old one into `archive/` and add a note here with removal ETA.
* Mapper snapshots should include a comment header with: date, purpose, related PR/issue.

Cleanup Policy:
* `archive/` items older than 30 days without reference should be removed.
* `temp/` should be pruned on every PR merge.

Current Archived Items (summary):
* API variants: asuUnit1Api.ts.(bak|new|new.save|update|update2|getProductionEntries)
* Dashboard duplicates: TotalASUUnit1YarnSummary.(js|jsx) + legacy index.js
* YarnProductionSummary variants: YarnProductionSummaryFixed.tsx, YarnProductionSummaryNew.tsx
* Page backups: ASUUnit1Page.tsx.new, Dashboard.tsx.new
* Root fix scripts & helpers: fix_customer_name_display.js, fixed.js

If any archived file is still needed in production, restore and delete its redundant variants.
