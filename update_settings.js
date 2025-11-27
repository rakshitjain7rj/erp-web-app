const fs = require('fs');
const path = '/home/rakshit/.config/Code - Insiders/User/settings.json';

try {
  const data = fs.readFileSync(path, 'utf8');
  const settings = JSON.parse(data);

  if (!settings['chat.tools.terminal.autoApprove']) {
    settings['chat.tools.terminal.autoApprove'] = {};
  }

  // Add common commands we are using
  settings['chat.tools.terminal.autoApprove']['npm run migrate'] = true;
  settings['chat.tools.terminal.autoApprove']['npx sequelize-cli db:migrate'] = true;
  settings['chat.tools.terminal.autoApprove']['npm install'] = true;
  
  // Add a regex for the migration command with env vars
  settings['chat.tools.terminal.autoApprove']['/^cd "/home/rakshit/web apps/erp-web-app/server" && npm run migrate$/'] = {
      "approve": true,
      "matchCommandLine": true
  };

  fs.writeFileSync(path, JSON.stringify(settings, null, 4), 'utf8');
  console.log('Settings updated successfully.');
} catch (err) {
  console.error('Error updating settings:', err);
}
