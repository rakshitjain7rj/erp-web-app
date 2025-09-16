/**
 * Superadmin seed.
 *
 * Instructions:
 * 1. Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD (and optionally SUPERADMIN_NAME) in your .env.production (and/or .env) file.
 *    Example:
 *      SUPERADMIN_EMAIL=admin@example.com
 *      SUPERADMIN_PASSWORD=ChangeMeStrong!123
 *      SUPERADMIN_NAME=Super Admin
 * 2. Run the seed command:
 *      npx sequelize-cli db:seed:all
 *
 * Idempotency:
 * - This seed checks if a user with SUPERADMIN_EMAIL already exists. If yes, it does nothing.
 * - Safe to run multiple times.
 */

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const email = process.env.SUPERADMIN_EMAIL;
    const plainPassword = process.env.SUPERADMIN_PASSWORD;
    const name = process.env.SUPERADMIN_NAME || 'Super Admin';

    if (!email || !plainPassword) {
      console.warn('[Superadmin Seed] SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD not set. Skipping superadmin seed.');
      return;
    }

    // Check if user already exists
    const [existing] = await queryInterface.sequelize.query(
      'SELECT id FROM "Users" WHERE email = :email LIMIT 1',
      { replacements: { email }, type: Sequelize.QueryTypes.SELECT }
    );

    if (existing) {
      console.log(`[Superadmin Seed] User with email ${email} already exists. Skipping creation.`);
      return;
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Insert new superadmin user (respecting current model columns)
    await queryInterface.bulkInsert('Users', [{
      name,
      email,
      password: passwordHash, // Model field is 'password'
      role: 'admin', // Using existing ENUM values. If 'superadmin' is desired, update the ENUM first.
      status: 'active', // Using existing ENUM values.
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    console.log(`[Superadmin Seed] Created initial superadmin user with email ${email}.`);
  },

  down: async (queryInterface, Sequelize) => {
    const email = process.env.SUPERADMIN_EMAIL;
    if (!email) {
      console.warn('[Superadmin Seed] SUPERADMIN_EMAIL not set. Cannot safely undo.');
      return;
    }
    await queryInterface.bulkDelete('Users', { email });
    console.log(`[Superadmin Seed] Removed superadmin user with email ${email}.`);
  }
};
