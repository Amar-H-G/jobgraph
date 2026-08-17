const neo4j = require('neo4j-driver');

let driver;

function getDriver() {
  if (!driver) {
    const uri      = process.env.COGNODB_URI;
    const username = process.env.COGNODB_USERNAME;
    const password = process.env.COGNODB_PASSWORD;

    if (!uri || !username || !password) {
      throw new Error('CognoDB connection environment variables are not set.');
    }

    driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      maxConnectionPoolSize: 10,
      connectionAcquisitionTimeout: 10000,
    });
  }
  return driver;
}

async function verifyConnectivity() {
  const d = getDriver();
  await d.verifyConnectivity();
  console.log('[DB] Connected to CognoDB successfully.');
}

async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

/**
 * Run a single parameterized Cypher query and return plain-object records.
 * @param {string} query  - Cypher query string
 * @param {object} params - Query parameters
 * @returns {Promise<object[]>} Array of plain-object records
 */
async function runQuery(query, params = {}) {
  const session = getDriver().session();
  try {
    const result = await session.run(query, params);
    return result.records.map(record => {
      const obj = {};
      record.keys.forEach(key => {
        obj[key] = toPlain(record.get(key));
      });
      return obj;
    });
  } finally {
    await session.close();
  }
}

/**
 * Recursively convert neo4j-driver types to plain JS values.
 */
function toPlain(value) {
  if (value === null || value === undefined) return value;

  // Neo4j Integer
  if (neo4j.isInt(value)) return value.toNumber();

  // Neo4j Node
  if (value && value.labels) {
    return { _labels: value.labels, ...toPlainObj(value.properties) };
  }

  // Neo4j Relationship
  if (value && value.type && value.startNodeElementId !== undefined) {
    return { _type: value.type, ...toPlainObj(value.properties) };
  }

  // Array
  if (Array.isArray(value)) return value.map(toPlain);

  // Plain object (e.g., map returned from Cypher)
  if (typeof value === 'object') return toPlainObj(value);

  return value;
}

function toPlainObj(obj) {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = toPlain(v);
  }
  return result;
}

module.exports = { getDriver, verifyConnectivity, closeDriver, runQuery };
