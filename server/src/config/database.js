require("dotenv").config();
const { Pool } = require("pg");
const { logger } = require("../utils/logger");

// Supabase PostgreSQL connection configuration
const config = {
  development: {
    host: process.env.SUPABASE_HOST || "localhost",
    port: process.env.SUPABASE_PORT || 5432,
    database: process.env.SUPABASE_DATABASE || "postgres",
    user: process.env.SUPABASE_USER || "postgres",
    password: process.env.SUPABASE_PASSWORD || "password",
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  },
  test: {
    host: process.env.SUPABASE_HOST || "localhost",
    port: process.env.SUPABASE_PORT || 5432,
    database: process.env.SUPABASE_DATABASE || "postgres",
    user: process.env.SUPABASE_USER || "postgres",
    password: process.env.SUPABASE_PASSWORD || "password",
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  production: {
    host: process.env.SUPABASE_HOST,
    port: process.env.SUPABASE_PORT || 5432,
    database: process.env.SUPABASE_DATABASE,
    user: process.env.SUPABASE_USER,
    password: process.env.SUPABASE_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};

const env = process.env.NODE_ENV || "development";
console.log("SSL enabled:", true);
console.log("Database host:", process.env.SUPABASE_HOST);
console.log("Database user:", process.env.SUPABASE_USER);
const poolConfig = config[env];

// Create connection pool
const pool = new Pool(poolConfig);

// Test database connection
pool.on("connect", () => {
  logger.info("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  logger.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Closing database pool...");
  await pool.end();
  process.exit(0);
});

// Database utility functions
const db = {
  // Execute a query with parameters
  query: async (text, params = []) => {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      logger.info("Executed query", { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error("Database query error", { text, error: error.message });
      throw error;
    }
  },

  // Get a single row
  getOne: async (text, params = []) => {
    const result = await pool.query(text, params);
    return result.rows[0] || null;
  },

  // Get multiple rows
  getMany: async (text, params = []) => {
    const result = await pool.query(text, params);
    return result.rows;
  },

  // Execute a transaction
  transaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  // Close the pool
  close: async () => {
    await pool.end();
  },
};

module.exports = { pool, db };
