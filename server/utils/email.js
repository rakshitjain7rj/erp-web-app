// Lightweight email utility placeholder to prevent MODULE_NOT_FOUND errors.
// Replace with real email transport (e.g., nodemailer, AWS SES) when ready.
const path = require('path');

/**
 * Send an invitation email (placeholder).
 * @param {string} recipientEmail
 * @param {string} token - Invitation / activation token
 */
async function sendInvitationEmail(recipientEmail, token) {
  // For now just log; in production integrate actual email service.
  console.log(`📨 [sendInvitationEmail] Would send invite to ${recipientEmail} with token: ${token}`);
  return { accepted: [recipientEmail], token };
}

module.exports = { sendInvitationEmail };
