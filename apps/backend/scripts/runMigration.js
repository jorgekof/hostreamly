const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Migration Runner Script
 * 
 * Executes SQL migration files using the existing database connection
 */

async function runMigration(migrationFile) {
  try {
    console.log(`Starting migration: ${migrationFile}`);
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL content by semicolons to execute individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          await sequelize.query(statement);
          console.log(`✓ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`✗ Error executing statement ${i + 1}:`);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
          console.error(`Error: ${error.message}`);
          
          // Continue with other statements unless it's a critical error
          if (error.code !== 'ER_TABLE_EXISTS_ERROR' && 
              error.code !== 'ER_DUP_KEYNAME' &&
              !error.message.includes('already exists')) {
            throw error;
          } else {
            console.log(`⚠ Skipping non-critical error: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`✓ Migration completed successfully: ${migrationFile}`);
    
  } catch (error) {
    console.error(`✗ Migration failed: ${migrationFile}`);
    console.error('Error:', error.message);
    throw error;
  }
}

async function main() {
  try {
    // Get migration file from command line arguments
    const migrationFile = process.argv[2];
    
    if (!migrationFile) {
      console.error('Usage: node runMigration.js <migration-file>');
      console.error('Example: node runMigration.js create_analytics_tables.sql');
      process.exit(1);
    }
    
    console.log('Connecting to database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection successful');
    
    // Run the migration
    await runMigration(migrationFile);
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Migration failed!');
    console.error('Error:', error.message);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', error.stack);
    }
    
    process.exit(1);
  } finally {
    // Close database connection
    try {
      await sequelize.close();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error.message);
    }
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { runMigration };