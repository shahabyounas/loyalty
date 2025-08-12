#!/usr/bin/env node

require("dotenv").config();
const { User } = require("../models");
const { db } = require("../config/database");
const { logger } = require("../utils/logger");

async function addSuperUser(email, firstName, lastName, password) {
  try {
    console.log("👑 Starting super user creation...");

    // Check for existing user
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.error("❌ User with this email already exists!");
      process.exit(1);
    }

    // Create super admin user
    // Note: In production, this should be integrated with Supabase Auth
    const superUser = await User.createSuperAdmin(
      `su_${Date.now()}`, // Temporary auth_user_id
      {
        email,
        first_name: firstName,
        last_name: lastName,
        password_hash: password, // In production, this should be properly hashed
      }
    );

    console.log("\n✅ Super user created successfully!");
    console.log("\n🔑 User Details:");
    console.log(`   Email: ${superUser.email}`);
    console.log(`   Name: ${superUser.first_name} ${superUser.last_name}`);
    console.log(`   Role: Super Admin`);

    console.log("\n⚠️  Important:");
    console.log("   1. Change the password immediately after first login");
    console.log(
      "   2. This is a development setup - in production, use Supabase Auth"
    );
  } catch (error) {
    console.error("❌ Failed to create super user:", error);
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  // Using default values for super admin
  const defaultSuperAdmin = {
    email: "superadmin@loyalty.com",
    firstName: "System",
    lastName: "Administrator",
    password: "SuperAdmin123!", // This is a default password that should be changed after first login
  };

  addSuperUser(
    defaultSuperAdmin.email,
    defaultSuperAdmin.firstName,
    defaultSuperAdmin.lastName,
    defaultSuperAdmin.password
  )
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}

module.exports = addSuperUser;
