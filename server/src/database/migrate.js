require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const { db } = require("../config/database");
const { logger } = require("../utils/logger");

class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(__dirname, "migrations");
    this.migrationsTable = "migrations";
  }

  async init() {
    try {
      console.log("Initializing migrations table...");
      // Create migrations table if it doesn't exist
      await db.query(`
        CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("Migrations table initialized");
      logger.info("Migrations table initialized");
    } catch (error) {
      console.error("Failed to initialize migrations table:", error);
      logger.error("Failed to initialize migrations table:", error);
      throw error;
    }
  }

  async getExecutedMigrations() {
    try {
      console.log("Getting executed migrations...");
      const result = await db.query(
        `SELECT name FROM ${this.migrationsTable} ORDER BY id`
      );
      console.log(
        "Executed migrations:",
        result.rows.map((row) => row.name)
      );
      return result.rows.map((row) => row.name);
    } catch (error) {
      console.error("Failed to get executed migrations:", error);
      logger.error("Failed to get executed migrations:", error);
      throw error;
    }
  }

  async getMigrationFiles() {
    try {
      console.log("Reading migration files from:", this.migrationsPath);
      const files = await fs.readdir(this.migrationsPath);
      const sqlFiles = files.filter((file) => file.endsWith(".sql")).sort();
      console.log("Migration files found:", sqlFiles);
      return sqlFiles;
    } catch (error) {
      console.error("Failed to read migration files:", error);
      logger.error("Failed to read migration files:", error);
      throw error;
    }
  }

  async executeMigration(migrationName) {
    try {
      console.log(`Executing migration: ${migrationName}`);
      const filePath = path.join(this.migrationsPath, migrationName);
      const sql = await fs.readFile(filePath, "utf8");

      // Execute the migration
      await db.query(sql);

      // Record the migration as executed
      await db.query(`INSERT INTO ${this.migrationsTable} (name) VALUES ($1)`, [
        migrationName,
      ]);

      console.log(`Migration executed: ${migrationName}`);
      logger.info(`Migration executed: ${migrationName}`);
    } catch (error) {
      console.error(`Failed to execute migration ${migrationName}:`, error);
      logger.error(`Failed to execute migration ${migrationName}:`, error);
      throw error;
    }
  }

  async runMigrations() {
    try {
      console.log("Starting migration process...");
      await this.init();

      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();

      const pendingMigrations = migrationFiles.filter(
        (file) => !executedMigrations.includes(file)
      );

      console.log("Pending migrations:", pendingMigrations);

      if (pendingMigrations.length === 0) {
        console.log("No pending migrations");
        logger.info("No pending migrations");
        return;
      }

      console.log(`Found ${pendingMigrations.length} pending migrations`);

      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      console.log("All migrations completed successfully");
      logger.info("All migrations completed successfully");
    } catch (error) {
      console.error("Migration failed:", error);
      logger.error("Migration failed:", error);
      throw error;
    }
  }

  async rollbackMigration(migrationName) {
    try {
      // This is a simplified rollback - in production you'd want more sophisticated rollback logic
      await db.query(`DELETE FROM ${this.migrationsTable} WHERE name = $1`, [
        migrationName,
      ]);
      console.log(`Migration rolled back: ${migrationName}`);
      logger.info(`Migration rolled back: ${migrationName}`);
    } catch (error) {
      console.error(`Failed to rollback migration ${migrationName}:`, error);
      logger.error(`Failed to rollback migration ${migrationName}:`, error);
      throw error;
    }
  }

  async status() {
    try {
      console.log("Getting migration status...");
      await this.init();

      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();

      console.log("Migration Status:");
      migrationFiles.forEach((file) => {
        const status = executedMigrations.includes(file)
          ? "✓ Executed"
          : "⏳ Pending";
        console.log(`  ${file}: ${status}`);
      });

      logger.info("Migration Status:");
      migrationFiles.forEach((file) => {
        const status = executedMigrations.includes(file)
          ? "✓ Executed"
          : "⏳ Pending";
        logger.info(`  ${file}: ${status}`);
      });
    } catch (error) {
      console.error("Failed to get migration status:", error);
      logger.error("Failed to get migration status:", error);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  console.log("Migration runner started");
  const runner = new MigrationRunner();
  const command = process.argv[2];

  console.log("Command:", command);

  switch (command) {
    case "run":
      runner
        .runMigrations()
        .then(() => {
          console.log("Migration completed successfully");
          process.exit(0);
        })
        .catch((error) => {
          console.error("Migration failed:", error);
          process.exit(1);
        });
      break;
    case "status":
      runner
        .status()
        .then(() => {
          console.log("Status check completed");
          process.exit(0);
        })
        .catch((error) => {
          console.error("Status check failed:", error);
          process.exit(1);
        });
      break;
    default:
      console.log("Usage: node migrate.js [run|status]");
      process.exit(1);
  }
}

module.exports = MigrationRunner;
