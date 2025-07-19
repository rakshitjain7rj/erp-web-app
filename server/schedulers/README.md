# Production Summary Scheduler

This module automatically generates and sends daily production, job completion, and machine performance summaries via email and WhatsApp.

## Features

- **Automated Scheduling**: Runs daily at 8 PM
- **Multi-channel Notifications**: Sends reports via both email and WhatsApp
- **Comprehensive Reports**: Includes production data, dyeing job completions, and machine performance metrics
- **CSV Export**: Generates downloadable CSV reports for further analysis
- **Error Handling**: Includes robust error handling and logging
- **Backup Check**: Runs a verification job at 8:30 PM to ensure reports were generated

## Configuration

Configure the scheduler by adding the following variables to your `.env` file:

```
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_RECIPIENTS=manager@example.com,admin@example.com

# WhatsApp Configuration
WHATSAPP_API_KEY=your-whatsapp-business-api-key
WHATSAPP_RECIPIENTS=+910000000000,+910000000001

# Scheduler Configuration
SCHEDULER_ENABLED=true
SCHEDULER_SUMMARY_TIME=20:00
```

## Report Details

### Email Report

The email report includes:

1. **Summary Overview**
   - Total production in kg
   - Average machine efficiency
   - Number of active machines
   - Completed dyeing jobs

2. **ASU Production Details**
   - Production by machine
   - Efficiency percentages

3. **Dyeing Jobs Completed**
   - Order details
   - Party information
   - Fabric specifications

4. **Machine Maintenance**
   - Machines needing maintenance
   - Last maintenance dates

### WhatsApp Report

The WhatsApp report includes a condensed version of the summary with the most critical metrics:

- Total production
- Average efficiency
- Active machines count
- Completed dyeing jobs
- Maintenance alerts

## Manual Testing

You can manually test the scheduler by running:

```
npm run test-scheduler
```

This will generate and send the reports immediately, regardless of the scheduled time.

## Report Storage

CSV reports are stored in the `/reports` directory with filenames in the format:

- `production-YYYY-MM-DD.csv`
- `dyeing-YYYY-MM-DD.csv`

These files can be accessed directly on the server for historical analysis.

## Troubleshooting

Check the log files in the `/logs` directory for detailed error information:

- `combined.log`: Contains all log entries
- `error.log`: Contains only error-level entries

Common issues:

1. **Email not sending**: Verify your SMTP settings and ensure the EMAIL_PASSWORD is an app-specific password if using Gmail
2. **WhatsApp messages failing**: Check your WhatsApp Business API configuration and recipient numbers
3. **No data in reports**: Verify database connectivity and that production entries exist for the reporting period
