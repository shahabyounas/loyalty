require("dotenv").config();
const { Client } = require("pg");
const { logger } = require("../utils/logger");

// Supabase PostgreSQL connection configuration
const config = {
  development: {
    host: process.env.SUPABASE_HOST || "localhost",
    port: process.env.SUPABASE_PORT || 5432,
    database: process.env.SUPABASE_DATABASE || "postgres",
    user: process.env.SUPABASE_USER || "postgres",
    password: process.env.SUPABASE_PASSWORD || "password",
    ssl: false, // Disable SSL for local development
  },
  test: {
    host: process.env.SUPABASE_HOST || "localhost",
    port: process.env.SUPABASE_PORT || 5432,
    database: process.env.SUPABASE_DATABASE || "postgres",
    user: process.env.SUPABASE_USER || "postgres",
    password: process.env.SUPABASE_PASSWORD || "password",
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  },
  production: {
    host: process.env.SUPABASE_HOST,
    port: process.env.SUPABASE_PORT || 5432,
    database: process.env.SUPABASE_DATABASE,
    user: process.env.SUPABASE_USER,
    password: process.env.SUPABASE_PASSWORD,
    ssl: { rejectUnauthorized: false },
  },
};

const env = process.env.NODE_ENV || "development";
const clientConfig = config[env];

// Prefer a single connection string if provided (e.g., DATABASE_URL)
// Note: SUPABASE_DATABASE is the database name, NOT a connection string.
const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_CONNECTION_STRING ||
  "";

// Helpful logs
console.log("DB env:", env);
if (connectionString) {
  console.log("Using connection string:", Boolean(connectionString));
} else {
  // If in development but targeting a remote host, enable SSL automatically
  const isLocalHost = ["localhost", "127.0.0.1"].includes(
    String(clientConfig.host || "").toLowerCase()
  );
  if (env === "development" && !isLocalHost) {
    clientConfig.ssl = { rejectUnauthorized: false };
  }
  console.log("DB host:", clientConfig.host);
  console.log("DB user:", clientConfig.user);
  console.log("DB ssl:", Boolean(clientConfig.ssl));
}
console.log("connectionString", connectionString);
// Database utility functions
const db = {
  // Execute a query with parameters using a new client connection
  query: async (text, params = []) => {
    const start = Date.now();
    const client = new Client(
      connectionString
        ? { connectionString, ssl: { rejectUnauthorized: false } }
        : clientConfig
    );

    try {
      await client.connect();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      logger.info("Executed query", { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error("Database query error", { text, error: error.message });
      throw error;
    } finally {
      await client.end();
    }
  },

  // Get a single row
  getOne: async (text, params = []) => {
    const result = await db.query(text, params);
    return result.rows[0] || null;
  },

  // Get multiple rows
  getMany: async (text, params = []) => {
    const result = await db.query(text, params);
    return result.rows;
  },

  // Execute a transaction using a single client connection
  transaction: async (callback) => {
    const client = new Client(
      connectionString
        ? { connectionString, ssl: { rejectUnauthorized: false } }
        : clientConfig
    );

    try {
      await client.connect();
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      await client.end();
    }
  },

  // Test database connection
  testConnection: async () => {
    const client = new Client(
      connectionString
        ? { connectionString, ssl: { rejectUnauthorized: false } }
        : clientConfig
    );

    try {
      await client.connect();
      logger.info("Connected to PostgreSQL database");
      await client.end();
      return true;
    } catch (error) {
      logger.error("Database connection test failed", { error: error.message });
      await client.end();
      return false;
    }
  },
};

module.exports = { db };
