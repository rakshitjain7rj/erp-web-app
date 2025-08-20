# Database Schema Fix Documentation

## Issue Summary

Two critical issues were identified and fixed in the ERP web application:

1. **Foreign Key Constraint Violation**: When adding production entries for newly created machines, there was a foreign key constraint violation because the `machine_id` vs `machine_no` field naming was inconsistent.

2. **SQL Error**: In dashboard and machine performance queries, there were errors due to incorrectly referencing `pe.machine_id` when the actual column name is `pe.machine_no` or `pe.machine_number`.

## Database Schema

### ASU Machines Table

The `asu_machines` table structure:

| Column Name      | Data Type      | Description                                 |
|------------------|----------------|---------------------------------------------|
| id               | INTEGER        | Primary Key                                 |
| machine_no       | INTEGER        | Unique machine number                       |
| count            | INTEGER        | Machine count setting                       |
| spindles         | INTEGER        | Number of spindles                          |
| speed            | NUMERIC(10, 2) | Machine speed                               |
| production_at_100| NUMERIC(10, 2) | Production at 100% efficiency               |
| unit             | INTEGER        | Unit number (1 or 2)                        |
| is_active        | BOOLEAN        | Whether machine is active                   |
| created_at       | TIMESTAMP      | Creation timestamp                          |
| updated_at       | TIMESTAMP      | Update timestamp                            |

### ASU Production Entries Table

The `asu_production_entries` table structure:

| Column Name           | Data Type      | Description                              |
|-----------------------|----------------|------------------------------------------|
| id                    | INTEGER        | Primary Key                              |
| unit                  | INTEGER        | Unit number (1 or 2)                     |
| machine_number        | INTEGER        | References machine_no in asu_machines    |
| date                  | DATE           | Production date                          |
| shift                 | VARCHAR(10)    | 'day' or 'night'                         |
| actual_production     | NUMERIC(10, 2) | Actual production amount                 |
| theoretical_production| NUMERIC(10, 2) | Theoretical production amount            |
| efficiency            | NUMERIC(5, 2)  | Efficiency percentage                    |
| remarks               | TEXT           | Additional notes                         |
| created_at            | TIMESTAMP      | Creation timestamp                       |
| updated_at            | TIMESTAMP      | Update timestamp                         |

## Key Relationships

The relationship between `asu_machines` and `asu_production_entries` is established as:

- `asu_production_entries.machine_number` references `asu_machines.machine_no`

This relationship is defined in the Sequelize model as:

```javascript
ASUProductionEntry.belongsTo(models.ASUMachine, {
  foreignKey: 'machineNumber',
  targetKey: 'machineNo',
  as: 'machine'
});
```

## Changes Made

### 1. Model and Schema Alignment

The Sequelize model definitions were aligned with the actual database schema:

- In `ASUMachine.js`, the field mapping is correctly set: `machineNo` → `machine_no`
- In `ASUProductionEntry.js`, the field mapping is correctly set: `machineNumber` → `machine_no`

### 2. SQL Query Fixes

SQL queries in the controllers were updated to use the correct column names:

#### In dashboardController.js:
- Changed `JOIN "asu_machines" m ON pe.machine_id = m.id` to `JOIN "asu_machines" m ON pe.machine_no = m.machine_no`

#### In machinePerformanceController.js:
- Updated CTE query to use `machine_no` instead of `machine_id`
- Fixed JOIN condition: `LEFT JOIN ProductionStats ps ON m.machine_no = ps.machine_no`

### 3. Frontend-Backend Consistency

The frontend helper functions were updated to ensure consistent machine number format between frontend and backend:

- Enhanced `getMachineNumber` function to correctly extract numeric values
- Updated `createProductionEntry` implementation to use the correct machine number format

## Testing

To verify the fixes, two test scripts were created:

1. **check_schema_consistency.js**: Compares the model definitions with the actual database schema
   - Run with: `node dev_scripts/check_schema_consistency.js`

2. **test_and_verify_fixes.js**: Tests the fixed API endpoints and database operations
   - Run with: `node dev_scripts/test_and_verify_fixes.js`

## Important Notes

1. The older migration scripts (`asu_unit1_migration.sql`) reference `machine_id`, but the newer ones (`asu_production_entries_enhanced.sql`) use `machine_number`. The actual database schema uses `machine_number` or `machine_no`.

2. There are several places in the code where `machine_id` is still referenced (for example, in `SimpleMachineTable.tsx`), but these are just variable names in the frontend code that handle multiple possible field names using the OR operator (||).

3. Raw SQL queries should always use the actual database column names (`machine_no` or `machine_number`), not the JavaScript model property names.

## Recommendations

1. Keep a consistent naming convention across the application. Either use `machine_no` or `machine_number` everywhere.

2. When writing SQL queries, first check the actual database schema using:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'table_name'
   ORDER BY ordinal_position;
   ```

3. Run the `check_schema_consistency.js` script after any schema changes to ensure model-database alignment.
