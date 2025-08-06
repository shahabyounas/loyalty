#!/usr/bin/env node

/**
 * Database Setup Script
 *
 * This script helps set up the complete database for the multi-tenant loyalty system.
 * It runs migrations and seeds the database with sample data.
 */

require("dotenv").config();
const { execSync } = require("child_process");
const path = require("path");

console.log("🚀 Setting up Multi-Tenant Loyalty System Database...\n");
// Load DB connection variables from .env
const DB_HOST = process.env.DB_HOST || process.env.SUPABASE_HOST;
const DB_PORT = process.env.DB_PORT || process.env.SUPABASE_PORT;
const DB_NAME = process.env.DB_NAME || process.env.SUPABASE_DATABASE;
const DB_USER = process.env.DB_USER || process.env.SUPABASE_USER;
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.SUPABASE_PASSWORD;

// Check if database connection is configured
console.log("process.env.DB_HOST", DB_HOST, DB_NAME);
if (!DB_HOST || !DB_NAME) {
  console.error("❌ Database configuration not found!");
  console.error("Please ensure your .env file contains:");
  console.error("DB_HOST=localhost");
  console.error("DB_PORT=5432");
  console.error("DB_NAME=your_database_name");
  console.error("DB_USER=your_username");
  console.error("DB_PASSWORD=your_password");
  process.exit(1);
}

try {
  // Step 1: Run migrations
  console.log("📋 Step 1: Running database migrations...");
  execSync("npm run db:migrate", { stdio: "inherit" });
  console.log("✅ Migrations completed successfully!\n");

  // Step 2: Run seeder
  console.log("🌱 Step 2: Seeding database with sample data...");
  execSync("npm run db:seed", { stdio: "inherit" });
  console.log("✅ Seeding completed successfully!\n");

  console.log("🎉 Database setup completed successfully!");
  console.log("\n📊 What was created:");
  console.log("   • 1 Super Admin (superadmin@loyalty.com)");
  console.log(
    "   • 3 Sample Tenants (Vape Shop London, Cloud Nine Vapes, Diamond Vape Co)"
  );
  console.log("   • Complete user hierarchy for each tenant");
  console.log("   • Multiple stores with realistic data");
  console.log("   • Loyalty accounts with points and levels");
  console.log("   • Rewards catalog with various types");
  console.log("   • Digital stamp cards for customers");

  console.log("\n🔑 Default Login Credentials:");
  console.log("   Super Admin: superadmin@loyalty.com / SuperAdmin123!");
  console.log("   Tenant Admin: admin@[businessname].com / Password123!");
  console.log("   Staff: staff1@[businessname].com / Password123!");
  console.log("   Customer: customer1@[businessname].com / Password123!");

  console.log("\n📚 Next Steps:");
  console.log("   1. Start your server: npm run dev");
  console.log("   2. Test the API endpoints");
  console.log("   3. Build your frontend application");
  console.log("   4. Customize the system for your needs");

  console.log("\n🚨 Important:");
  console.log("   • Change default passwords in production");
  console.log("   • Configure proper environment variables");
  console.log("   • Set up proper security measures");

  console.log("\n✨ Your multi-tenant loyalty system is ready to use!");
} catch (error) {
  console.error("❌ Database setup failed:", error.message);
  console.error("\n🔧 Troubleshooting:");
  console.error("   1. Ensure PostgreSQL is running");
  console.error("   2. Check your database connection settings");
  console.error("   3. Verify your .env file is configured correctly");
  console.error("   4. Make sure you have the required permissions");
  process.exit(1);
}
