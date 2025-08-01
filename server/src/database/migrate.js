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
      // Create migrations table if it doesn't exist
      await db.query(`
        CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logger.info("Migrations table initialized");
    } catch (error) {
      logger.error("Failed to initialize migrations table:", error);
      throw error;
    }
  }

  async getExecutedMigrations() {
    try {
      const result = await db.query(
        `SELECT name FROM ${this.migrationsTable} ORDER BY id`
      );
      return result.rows.map((row) => row.name);
    } catch (error) {
      logger.error("Failed to get executed migrations:", error);
      throw error;
    }
  }

  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files.filter((file) => file.endsWith(".sql")).sort(); // Sort alphabetically to ensure order
    } catch (error) {
      logger.error("Failed to read migration files:", error);
      throw error;
    }
  }

  async executeMigration(migrationName) {
    try {
      const filePath = path.join(this.migrationsPath, migrationName);
      const sql = await fs.readFile(filePath, "utf8");

      // Execute the migration
      await db.query(sql);

      // Record the migration as executed
      await db.query(`INSERT INTO ${this.migrationsTable} (name) VALUES ($1)`, [
        migrationName,
      ]);

      logger.info(`Migration executed: ${migrationName}`);
    } catch (error) {
      logger.error(`Failed to execute migration ${migrationName}:`, error);
      throw error;
    }
  }

  async runMigrations() {
    try {
      await this.init();

      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();

      const pendingMigrations = migrationFiles.filter(
        (file) => !executedMigrations.includes(file)
      );

      if (pendingMigrations.length === 0) {
        logger.info("No pending migrations");
        return;
      }

      logger.info(`Found ${pendingMigrations.length} pending migrations`);

      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      logger.info("All migrations completed successfully");
    } catch (error) {
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
      logger.info(`Migration rolled back: ${migrationName}`);
    } catch (error) {
      logger.error(`Failed to rollback migration ${migrationName}:`, error);
      throw error;
    }
  }

  async status() {
    try {
      await this.init();

      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();

      logger.info("Migration Status:");
      migrationFiles.forEach((file) => {
        const status = executedMigrations.includes(file)
          ? "✓ Executed"
          : "⏳ Pending";
        logger.info(`  ${file}: ${status}`);
      });
    } catch (error) {
      logger.error("Failed to get migration status:", error);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const runner = new MigrationRunner();
  const command = process.argv[2];

  switch (command) {
    case "run":
      runner
        .runMigrations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case "status":
      runner
        .status()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    default:
      console.log("Usage: node migrate.js [run|status]");
      process.exit(1);
  }
}

module.exports = MigrationRunner;
