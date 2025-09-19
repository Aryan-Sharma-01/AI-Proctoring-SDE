const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('Connecting to MySQL server...');
    connection = await mysql.createConnection(config);
    
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Creating database and tables...');
    await connection.execute(schema);
    
    console.log('Database setup completed successfully!');
    console.log('Database: proctoring_system');
    console.log('Tables created: proctoring_sessions, proctoring_events, users, system_settings');
    console.log('Views created: session_summary, event_summary');
    console.log('Stored procedures created: GetSessionReport, GetEventStatistics');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
