'use strict';

/**
 * Add 'pending' to Users.status enum; default pending for new users.
 */
module.exports = {
  async up (queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres') {
        // Drop default first
        await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN status DROP DEFAULT;', { transaction: t });
        // Rename old type
        await queryInterface.sequelize.query('ALTER TYPE "enum_Users_status" RENAME TO "enum_Users_status_old";', { transaction: t });
        // Create new
        await queryInterface.sequelize.query("CREATE TYPE \"enum_Users_status\" AS ENUM('active','inactive','pending');", { transaction: t });
        // Update column to text then new enum
        await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN status TYPE text USING status::text;', { transaction: t });
        await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN status TYPE "enum_Users_status" USING status::text::"enum_Users_status";', { transaction: t });
        // Set existing active/inactive fine; ensure others become pending
        await queryInterface.sequelize.query("UPDATE \"Users\" SET status='pending' WHERE status NOT IN ('active','inactive');", { transaction: t });
        // Drop old type
        await queryInterface.sequelize.query('DROP TYPE "enum_Users_status_old";', { transaction: t });
        // New default
        await queryInterface.sequelize.query("ALTER TABLE \"Users\" ALTER COLUMN status SET DEFAULT 'pending';", { transaction: t });
      } else {
        await queryInterface.changeColumn('Users','status', {
          type: Sequelize.ENUM('active','inactive','pending'),
          allowNull: false,
          defaultValue: 'pending'
        }, { transaction: t });
      }
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },
  async down (queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres') {
        await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN status DROP DEFAULT;', { transaction: t });
        await queryInterface.sequelize.query('ALTER TYPE "enum_Users_status" RENAME TO "enum_Users_status_new";', { transaction: t });
        await queryInterface.sequelize.query("CREATE TYPE \"enum_Users_status\" AS ENUM('active','inactive');", { transaction: t });
        await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN status TYPE text USING status::text;', { transaction: t });
        await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN status TYPE "enum_Users_status" USING status::text::"enum_Users_status";', { transaction: t });
        await queryInterface.sequelize.query('DROP TYPE "enum_Users_status_new";', { transaction: t });
        await queryInterface.sequelize.query("ALTER TABLE \"Users\" ALTER COLUMN status SET DEFAULT 'active';", { transaction: t });
      } else {
        await queryInterface.changeColumn('Users','status', {
          type: Sequelize.ENUM('active','inactive'),
          allowNull: false,
          defaultValue: 'active'
        }, { transaction: t });
      }
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }
};
