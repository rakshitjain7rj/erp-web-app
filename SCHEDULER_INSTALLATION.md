# Production Summary Scheduler Installation Guide

Follow these steps to install and configure the new production summary scheduler that sends daily emails and WhatsApp messages with production statistics.

## 1. Install Required Packages

First, install all the required npm packages for the scheduler:

```bash
cd server
npm install node-cron nodemailer winston axios
```

## 2. Configure Environment Variables

Add the following variables to your `.env` file:

```
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
# For Gmail, you'll need to create an "App Password" in your Google account security settings
EMAIL_PASSWORD=your-app-password
EMAIL_RECIPIENTS=manager@example.com,admin@example.com,supervisor@example.com

# WhatsApp Configuration (using a WhatsApp Business API provider)
WHATSAPP_API_KEY=your-whatsapp-business-api-key
WHATSAPP_RECIPIENTS=+910000000000,+910000000001
```

## 3. Set Up a WhatsApp Business API Provider

To send WhatsApp messages, you need to sign up with a WhatsApp Business API provider. Options include:

- [Twilio](https://www.twilio.com/whatsapp)
- [MessageBird](https://messagebird.com/products/whatsapp)
- [360Dialog](https://www.360dialog.com/)

Once you have your API credentials, update the WhatsApp API implementation in the scheduler with your provider's specific code.

## 4. Create Required Directories

The scheduler needs directories to store logs and reports:

```bash
mkdir -p server/logs
mkdir -p server/reports
```

Ensure the user running the Node.js process has write access to these directories.

## 5. Testing the Scheduler

Before deploying, test that the scheduler works correctly:

```bash
npm run test-scheduler
```

This will generate a report and attempt to send it immediately.

## 6. Adjusting the Schedule

By default, the scheduler runs at 8:00 PM daily. To change this time:

1. Open `server/schedulers/productionSummaryScheduler.js`
2. Find the cron schedule pattern: `'0 0 20 * * *'`
3. Modify it according to your requirements. The format is:
   `Second(0-59) Minute(0-59) Hour(0-23) Day_of_month(1-31) Month(1-12) Day_of_week(0-6)`

For example, to run at 10:30 AM daily, use: `'0 30 10 * * *'`

## 7. Customizing the Report Content

To customize what appears in the reports:

- Edit the `generateEmailHTML` function to change the email template
- Edit the `generateWhatsAppText` function to change the WhatsApp message format
- Modify the `getProductionSummary` function to collect different data points

## 8. Adding to System Startup

To ensure the scheduler starts when your server reboots:

### Using PM2:

```bash
npm install -g pm2
pm2 start index.js --name "erp-server"
pm2 save
pm2 startup
```

Follow the instructions provided by PM2 to set up the startup script.

## 9. Monitoring

Check the logs to ensure the scheduler is running properly:

```bash
tail -f server/logs/combined.log
```

Look for entries like "Production summary scheduler initialized" and "Daily production summary completed successfully".
