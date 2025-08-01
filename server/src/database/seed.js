require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const { db } = require("../config/database");
const { logger } = require("../utils/logger");

class SeederRunner {
  constructor() {
    this.seedersPath = path.join(__dirname, "seeders");
  }

  async getSeederFiles() {
    try {
      const files = await fs.readdir(this.seedersPath);
      return files.filter((file) => file.endsWith(".sql")).sort();
    } catch (error) {
      logger.error("Failed to read seeder files:", error);
      throw error;
    }
  }

  async executeSeeder(seederName) {
    try {
      const filePath = path.join(this.seedersPath, seederName);
      const sql = await fs.readFile(filePath, "utf8");

      await db.query(sql);
      logger.info(`Seeder executed: ${seederName}`);
    } catch (error) {
      logger.error(`Failed to execute seeder ${seederName}:`, error);
      throw error;
    }
  }

  async runSeeders() {
    try {
      const seederFiles = await this.getSeederFiles();

      if (seederFiles.length === 0) {
        logger.info("No seeders found");
        return;
      }

      logger.info(`Found ${seederFiles.length} seeders`);

      for (const seeder of seederFiles) {
        await this.executeSeeder(seeder);
      }

      logger.info("All seeders completed successfully");
    } catch (error) {
      logger.error("Seeding failed:", error);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const seeder = new SeederRunner();

  seeder
    .runSeeders()
    .then(() => {
      logger.info("Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Seeding failed:", error);
      process.exit(1);
    });
}

module.exports = SeederRunner;
