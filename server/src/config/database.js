require("dotenv").config();
const { Pool } = require("pg");
const { logger } = require("../utils/logger");

// Database connection pool configuration
const poolConfig = {
  development: {
    host: process.env.SUPABASE_HOST || "localhost",
    port: process.env.SUPABASE_PORT || 5432,
    database: process.env.SUPABASE_DATABASE || "loyalty_db",
    user: process.env.SUPABASE_USER || "postgres",
    password: process.env.SUPABASE_PASSWORD || "password",
    ssl: false,
    // Connection pool settings
    max: 10, // Maximum number of clients in the pool
    min: 2, // Minimum number of clients in the pool
    idle: 10000, // Close idle clients after 10 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
  },
  test: {
    host: process.env.SUPABASE_HOST || "localhost",
    port: process.env.SUPABASE_PORT || 5432,
    database: process.env.SUPABASE_DATABASE || "loyalty_db_test",
    user: process.env.SUPABASE_USER || "postgres",
    password: process.env.SUPABASE_PASSWORD || "password",
    ssl: { rejectUnauthorized: false },
    max: 5,
    min: 1,
    idle: 10000,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    maxUses: 1000,
  },
  production: {
    host: process.env.SUPABASE_HOST,
    port: process.env.SUPABASE_PORT || 5432,
    database: process.env.SUPABASE_DATABASE,
    user: process.env.SUPABASE_USER,
    password: process.env.SUPABASE_PASSWORD,
    ssl: { rejectUnauthorized: false },
    // Production pool settings
    max: 20, // Higher pool size for production
    min: 5, // More minimum connections
    idle: 30000, // Keep connections alive longer
    connectionTimeoutMillis: 15000, // Longer connection timeout
    idleTimeoutMillis: 60000, // Keep idle connections longer
    maxUses: 10000, // Higher usage limit
  },
};

const env = process.env.NODE_ENV || "development";
const config = poolConfig[env];

// Prefer connection string if provided
const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_CONNECTION_STRING;

// Create connection pool
let pool;

// Function to create pool with error handling
const createPool = () => {
  try {
    if (connectionString) {
      // Use connection string with pool configuration
      pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        ...poolConfig[env], // Apply environment-specific pool settings
      });
    } else {
      // Use individual config parameters
      pool = new Pool(config);
    }

    // Set up pool event handlers
    setupPoolEventHandlers();

    logger.info("Database pool created successfully", {
      environment: env,
      host: config.host,
      database: config.database,
      ssl: Boolean(config.ssl),
      poolSize: config.max,
      connectionString: Boolean(connectionString),
    });

    return pool;
  } catch (error) {
    logger.error("Failed to create database pool", {
      error: error.message,
      config: {
        host: config.host,
        database: config.database,
        user: config.user,
        ssl: Boolean(config.ssl),
      },
    });
    throw error;
  }
};

// Function to set up pool event handlers
const setupPoolEventHandlers = () => {
  pool.on("connect", (client) => {
    logger.info("New client connected to database pool");
  });

  pool.on("acquire", (client) => {
    logger.debug("Client acquired from pool");
  });

  pool.on("error", (err, client) => {
    logger.error("Unexpected error on idle client", err);
    // Don't throw here, let the pool handle reconnection
  });

  pool.on("remove", (client) => {
    logger.info("Client removed from pool");
  });
};

// Initialize pool
try {
  pool = createPool();
} catch (error) {
  logger.error("Database initialization failed", error);
  // Don't exit the process, let the application handle it gracefully
}

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Received SIGINT, closing database pool...");
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, closing database pool...");
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

// Database utility functions using the pool
const db = {
  // Execute a query with parameters
  query: async (text, params = []) => {
    if (!pool) {
      throw new Error(
        "Database pool not initialized. Please check your database configuration."
      );
    }

    const start = Date.now();
    let client;

    try {
      client = await pool.connect();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      logger.info("Executed query", {
        text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        duration,
        rows: result.rowCount,
      });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error("Database query error", {
        text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        error: error.message,
        stack: error.stack,
        duration,
        host: config.host,
        database: config.database,
      });

      // Provide more helpful error messages
      if (error.code === "ENOTFOUND") {
        throw new Error(
          `Database connection failed: Cannot resolve hostname '${config.host}'. Please check your SUPABASE_HOST environment variable.`
        );
      } else if (error.code === "ECONNREFUSED") {
        throw new Error(
          `Database connection refused: Cannot connect to ${config.host}:${config.port}. Please ensure the database server is running.`
        );
      } else if (error.code === "28P01") {
        throw new Error(
          `Authentication failed: Invalid username or password for database '${config.database}'. Please check your SUPABASE_USER and SUPABASE_PASSWORD.`
        );
      } else if (error.code === "3D000") {
        throw new Error(
          `Database '${config.database}' does not exist. Please create the database first.`
        );
      }

      throw error;
    } finally {
      if (client) {
        client.release(); // Return client to pool
      }
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
    if (!pool) {
      throw new Error(
        "Database pool not initialized. Please check your database configuration."
      );
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Transaction rolled back", { error: error.message });
      throw error;
    } finally {
      client.release(); // Return client to pool
    }
  },

  // Test database connection
  testConnection: async () => {
    try {
      const result = await db.query(
        "SELECT NOW() as current_time, version() as db_version"
      );
      logger.info("Database connection test successful", {
        currentTime: result.rows[0].current_time,
        version: result.rows[0].db_version.substring(0, 50) + "...",
      });
      return true;
    } catch (error) {
      logger.error("Database connection test failed", {
        error: error.message,
        code: error.code,
        host: config.host,
        database: config.database,
      });
      return false;
    }
  },

  // Get pool status
  getPoolStatus: () => {
    if (!pool) {
      return { error: "Database pool not initialized" };
    }
    return {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
      environment: env,
    };
  },

  // Close the pool (for testing or shutdown)
  closePool: async () => {
    if (pool) {
      await pool.end();
    }
  },

  // Check if pool is healthy
  isHealthy: () => {
    return pool && pool.totalCount > 0;
  },
};

// Log database configuration
logger.info("Database configuration", {
  environment: env,
  host: config.host,
  database: config.database,
  user: config.user,
  ssl: Boolean(config.ssl),
  poolSize: config.max,
  connectionString: Boolean(connectionString),
});

module.exports = { db, pool };
