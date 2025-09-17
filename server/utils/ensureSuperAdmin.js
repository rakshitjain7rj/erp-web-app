const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Ensures a superadmin user exists (idempotent).
 * - Creates if missing (role=superadmin, status=active)
 * - If exists but wrong role, patches to superadmin (unless ENV SUPERADMIN_LOCK_ROLE=false)
 * - If SUPERADMIN_PASSWORD changed and SUPERADMIN_UPDATE_PASSWORD=true, re-hashes
 */
async function ensureSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME || 'Super Admin';

  if (!email || !password) {
    console.warn('[ensureSuperAdmin] SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD not set. Skipping.');
    return;
  }
  try {
    let user = await User.unscoped().findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      const hash = await bcrypt.hash(password, 12);
      user = await User.create({
        name,
        email: email.toLowerCase().trim(),
        password: hash,
        role: 'superadmin',
        status: 'active'
      });
      console.log('[ensureSuperAdmin] Created superadmin:', email);
      return;
    }

    let changed = false;
    // Patch role
    if (user.role !== 'superadmin') {
      if (process.env.SUPERADMIN_LOCK_ROLE === 'false') {
        user.role = 'superadmin';
        changed = true;
        console.log('[ensureSuperAdmin] Elevated existing user to superadmin:', email);
      } else {
        console.warn('[ensureSuperAdmin] Existing user not superadmin; SUPERADMIN_LOCK_ROLE prevents elevation');
      }
    }
    // Activate if needed
    if (user.status !== 'active') {
      user.status = 'active';
      changed = true;
      console.log('[ensureSuperAdmin] Activated superadmin account:', email);
    }
    // Update password if flagged
    if (process.env.SUPERADMIN_UPDATE_PASSWORD === 'true') {
      const isSame = await bcrypt.compare(password, user.password || '');
      if (!isSame) {
        user.password = await bcrypt.hash(password, 12);
        changed = true;
        console.log('[ensureSuperAdmin] Updated superadmin password from env.');
      }
    }
    if (changed) await user.save();
  } catch (err) {
    console.error('[ensureSuperAdmin] Error:', err.message);
  }
}

module.exports = { ensureSuperAdmin };
