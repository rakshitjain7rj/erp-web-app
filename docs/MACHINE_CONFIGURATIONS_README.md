## Resolving "relation machine_configurations does not exist" Error

### Problem
The frontend is attempting to create production entries but the server is returning an error: "relation 'machine_configurations' does not exist". This is likely because the backend is trying to reference a database table that hasn't been created yet.

### Solution
You need to create the `machine_configurations` table in your database and add the required API endpoints to handle machine configurations.

### Steps to Fix

1. **Execute the SQL migration**
   Run the `add_machine_configurations_table.sql` file that's already in your project root to create the necessary table:

   ```bash
   psql -U your_username -d your_database -a -f add_machine_configurations_table.sql
   ```

2. **Add API Endpoints**
   You need to add the following routes to your backend API:

   a. **GET /api/asu-unit1/machine-configurations/:machineId**
      - Returns configuration history for a specific machine
      - Sorted by created_at (newest first)

   b. **POST /api/asu-unit1/machine-configurations**
      - Saves a new configuration entry
      - Request body should contain:
        ```json
        {
          "machineId": 123,
          "configuration": {
            "count": 30,
            "spindles": 960,
            "speed": 15000,
            "yarnType": "Cotton",
            "productionAt100": 400,
            "savedAt": "2023-01-01T12:00:00.000Z"
          }
        }
        ```

   c. **POST /api/asu-unit1/ensure-machine-configurations-table**
      - Helper endpoint to verify and create the table if it doesn't exist
      - Should execute the SQL in `add_machine_configurations_table.sql` if needed

3. **Update Production Entry Creation Logic**
   Update your production entry creation logic to correctly handle the machine_configurations reference. This might involve:
   
   - Getting the latest configuration for the machine from the machine_configurations table
   - Using that configuration's productionAt100 value for the theoretical production calculation
   - Not trying to access machine_configurations if it doesn't exist yet

   **Temporary Frontend Fix Added:**
   - The frontend code now handles the "relation does not exist" error gracefully
   - When the error occurs, the app will continue to create production entries using local machine data
   - This is only a temporary fix - you should still create the table for proper functionality

### Data Migration
Consider running the `sync_machine_configurations.js` script to migrate existing configuration history from localStorage to the database. This will:

1. Fetch all machines
2. For each machine, get its configuration history from localStorage 
3. Save each configuration to the database

### Example Implementation

```javascript
// Example backend route handler for saving machine configurations
app.post('/api/asu-unit1/machine-configurations', async (req, res) => {
  const { machineId, configuration } = req.body;
  
  if (!machineId || !configuration) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: machineId and configuration"
    });
  }
  
  try {
    const result = await db.query(
      `INSERT INTO machine_configurations 
       (machine_id, count, yarn_type, spindles, speed, production_at_100, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        machineId,
        configuration.count || 0,
        configuration.yarnType || 'Cotton',
        configuration.spindles || 0,
        configuration.speed || 0,
        configuration.productionAt100 || 0,
        configuration.isActive !== undefined ? configuration.isActive : true,
        configuration.savedAt || new Date().toISOString()
      ]
    );
    
    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving machine configuration:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Temporary Workaround
If you need a quick workaround until you can implement the full solution, you can modify your production entry creation logic to not depend on the machine_configurations table:

```javascript
// Example patch for production entry creation
app.post('/api/asu-unit1/production-entries', async (req, res) => {
  const { machineNumber, date, shift, actualProduction, theoreticalProduction } = req.body;
  
  try {
    // Skip the machine_configurations lookup for now
    const result = await db.query(
      `INSERT INTO asu_production_entries
       (machine_number, date, shift, actual_production, theoretical_production)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [machineNumber, date, shift, actualProduction, theoreticalProduction]
    );
    
    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating production entry:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```
