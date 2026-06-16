const neo4j = require('neo4j-driver');

// Create Neo4j connection
const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(
        process.env.NEO4J_USERNAME,
        process.env.NEO4J_PASSWORD
    )
);

// Test the connection
const verifyConnection = async () => {
    try {
        await driver.verifyConnectivity();
        console.log('✅ Neo4j connected successfully');
    } catch (error) {
        console.error('❌ Neo4j connection failed:', error);
        process.exit(1);
    }
};

module.exports = { driver, verifyConnection };
