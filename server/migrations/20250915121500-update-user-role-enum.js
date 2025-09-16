'use strict';

/**
 * Migration: Update Users.role ENUM to ['superadmin','admin','manager']
 * Notes:
 *  - Existing roles: 'admin','manager','storekeeper'
 *  - Strategy: Add new enum type (for Postgres) then alter column & drop old type.
 *  - For any legacy 'storekeeper' users, map them to 'manager'.
 */

module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres') {
        // Ensure default removed before type surgery
        await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN role DROP DEFAULT;', { transaction });
        // Rename old type (if exists) with safe guard
        await queryInterface.sequelize.query(`DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role') THEN
            EXECUTE 'ALTER TYPE "enum_Users_role" RENAME TO "enum_Users_role_old"';
          END IF;
        END $$;`, { transaction });
        // Create new enum only if not present
        await queryInterface.sequelize.query(`DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role') THEN
            CREATE TYPE "enum_Users_role" AS ENUM('superadmin','admin','manager');
          END IF;
        END $$;`, { transaction });
        // Normalize legacy values (storekeeper -> manager, any other -> manager)
        await queryInterface.sequelize.query("UPDATE \"Users\" SET role='manager' WHERE role NOT IN ('superadmin','admin','manager');", { transaction });
        // Convert column temporarily to text if old type existed to avoid default casting issues
        await queryInterface.sequelize.query(`DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role_old') THEN
            ALTER TABLE "Users" ALTER COLUMN role TYPE text USING role::text;
          END IF;
        END $$;`, { transaction });
        // Finally set to new enum
        await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN role TYPE "enum_Users_role" USING role::text::"enum_Users_role";', { transaction });
        // Drop old type if it was there
        await queryInterface.sequelize.query(`DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role_old') THEN
            DROP TYPE "enum_Users_role_old";
          END IF;
        END $$;`, { transaction });
        // Reapply default
        await queryInterface.sequelize.query("ALTER TABLE \"Users\" ALTER COLUMN role SET DEFAULT 'manager';", { transaction });
      } else {
        // Fallback for MySQL / SQLite: change column directly
        await queryInterface.changeColumn('Users', 'role', {
          type: Sequelize.ENUM('superadmin','admin','manager'),
          allowNull: false,
          defaultValue: 'manager'
        }, { transaction });
        await queryInterface.sequelize.query("UPDATE \"Users\" SET role='manager' WHERE role NOT IN ('superadmin','admin','manager');", { transaction });
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres') {
        await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN role DROP DEFAULT;', { transaction });
        await queryInterface.sequelize.query(`DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role') THEN
            ALTER TYPE "enum_Users_role" RENAME TO "enum_Users_role_new";
          END IF; END $$;`, { transaction });
        await queryInterface.sequelize.query(`DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role') THEN
            CREATE TYPE "enum_Users_role" AS ENUM('admin','manager','storekeeper');
          END IF; END $$;`, { transaction });
        await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN role TYPE text USING role::text;', { transaction });
        await queryInterface.sequelize.query("UPDATE \"Users\" SET role='storekeeper' WHERE role='manager';", { transaction });
        await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN role TYPE "enum_Users_role" USING role::text::"enum_Users_role";', { transaction });
        await queryInterface.sequelize.query(`DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role_new') THEN
            DROP TYPE "enum_Users_role_new";
          END IF; END $$;`, { transaction });
        await queryInterface.sequelize.query("ALTER TABLE \"Users\" ALTER COLUMN role SET DEFAULT 'storekeeper';", { transaction });
      } else {
        await queryInterface.changeColumn('Users', 'role', {
          type: Sequelize.ENUM('admin','manager','storekeeper'),
          allowNull: false,
          defaultValue: 'storekeeper'
        }, { transaction });
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
