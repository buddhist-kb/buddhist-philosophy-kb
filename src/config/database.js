// Neo4j Database Connection Configuration
const neo4j = require('neo4j-driver');

// Initialize Neo4j driver
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
);

// Test connection
async function testConnection() {
  try {
    const session = driver.session();
    const result = await session.run('RETURN 1');
    await session.close();
    console.log('✓ Connected to Neo4j database');
    return true;
  } catch (error) {
    console.error('✗ Failed to connect to Neo4j:', error.message);
    return false;
  }
}

module.exports = {
  driver,
  testConnection
};
