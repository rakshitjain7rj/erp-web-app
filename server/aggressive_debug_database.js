const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Database connection
const DB_NAME = process.env.DB_NAME || 'yarn_erp';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// Define CountProduct model
const CountProduct = sequelize.define('CountProduct', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'customer_name'
  },
  partyName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'party_name'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  count: {
    type: DataTypes.STRING,
    defaultValue: 'Standard'
  },
  sentToDye: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'sent_to_dye'
  },
  sentQuantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'sent_quantity'
  },
  sentDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sent_date'
  }
}, {
  tableName: 'count_products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

async function aggressiveDebugDatabase() {
  try {
    await sequelize.authenticate();
    console.log('\n🔥 AGGRESSIVE DATABASE DEBUG SESSION STARTED');
    console.log('🔗 Database connection established successfully.');
    
    // Get all count products with RAW SQL to see exact database values
    console.log('\n📊 FETCHING RAW DATABASE RECORDS...');
    const [rawResults] = await sequelize.query('SELECT id, customer_name, party_name, quantity, count, sent_to_dye, sent_quantity, sent_date, created_at, updated_at FROM count_products ORDER BY id DESC LIMIT 10');
    
    console.log('\n🔍 RAW DATABASE RECORDS (Last 10):');
    console.log('=============================================');
    rawResults.forEach((record, index) => {
      console.log(`\n📋 Record ${index + 1} (ID: ${record.id}):`);
      console.log(`   Customer Name: "${record.customer_name}"`);
      console.log(`   Party Name: "${record.party_name}"`);
      console.log(`   Quantity: ${record.quantity}`);
      console.log(`   Count: ${record.count}`);
      console.log(`   Sent to Dye: ${record.sent_to_dye}`);
      console.log(`   Sent Quantity: ${record.sent_quantity}`);
      console.log(`   Created: ${record.created_at}`);
      console.log(`   Updated: ${record.updated_at}`);
      
      // CHECK FOR THE CORE ISSUE
      if (record.customer_name === record.party_name) {
        console.log(`   ⚠️  ISSUE DETECTED: Customer name equals party name!`);
      } else {
        console.log(`   ✅ GOOD: Customer name is different from party name`);
      }
    });
    
    // Now get the same data using Sequelize to see if there's any transformation
    console.log('\n🔄 FETCHING SAME DATA VIA SEQUELIZE...');
    const sequelizeResults = await CountProduct.findAll({
      limit: 10,
      order: [['id', 'DESC']]
    });
    
    console.log('\n🔍 SEQUELIZE RESULTS:');
    console.log('=============================================');
    sequelizeResults.forEach((record, index) => {
      console.log(`\n📋 Record ${index + 1} (ID: ${record.id}):`);
      console.log(`   Customer Name: "${record.customerName}"`);
      console.log(`   Party Name: "${record.partyName}"`);
      console.log(`   Quantity: ${record.quantity}`);
      
      // CHECK FOR TRANSFORMATION ISSUES
      if (record.customerName === record.partyName) {
        console.log(`   ⚠️  ISSUE DETECTED: Customer name equals party name via Sequelize!`);
      } else {
        console.log(`   ✅ GOOD: Customer name is different from party name via Sequelize`);
      }
    });
    
    // Check for any records where customer_name != party_name to verify the issue scope
    console.log('\n🔍 CHECKING FOR DISTINCT CUSTOMER VS PARTY NAMES...');
    const [distinctCheck] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN customer_name = party_name THEN 1 END) as same_names,
        COUNT(CASE WHEN customer_name != party_name THEN 1 END) as different_names
      FROM count_products
    `);
    
    console.log('\n📊 CUSTOMER NAME ANALYSIS:');
    console.log('=============================================');
    const stats = distinctCheck[0];
    console.log(`Total Records: ${stats.total_records}`);
    console.log(`Records with SAME customer/party names: ${stats.same_names}`);
    console.log(`Records with DIFFERENT customer/party names: ${stats.different_names}`);
    
    if (stats.same_names > 0) {
      console.log('\n⚠️  CRITICAL ISSUE CONFIRMED: Some records have identical customer and party names!');
      
      // Show examples of the problematic records
      console.log('\n🔍 SHOWING PROBLEM RECORDS...');
      const [problemRecords] = await sequelize.query(`
        SELECT id, customer_name, party_name, quantity, created_at, updated_at 
        FROM count_products 
        WHERE customer_name = party_name 
        ORDER BY updated_at DESC 
        LIMIT 5
      `);
      
      problemRecords.forEach((record, index) => {
        console.log(`\n❌ Problem Record ${index + 1}:`);
        console.log(`   ID: ${record.id}`);
        console.log(`   Customer Name: "${record.customer_name}"`);
        console.log(`   Party Name: "${record.party_name}"`);
        console.log(`   Last Updated: ${record.updated_at}`);
      });
    }
    
    console.log('\n🔥 DATABASE DEBUG COMPLETE');
    
  } catch (error) {
    console.error('❌ Database debug failed:', error);
  } finally {
    await sequelize.close();
  }
}

aggressiveDebugDatabase();
