require("dotenv").config();

console.log("🔍 Simple Database Test");
console.log("=======================");

// Test database connection
async function testDatabase() {
  try {
    console.log("1. Loading database config...");
    const { db } = require("./src/config/database");
    console.log("✅ Database config loaded");

    console.log("2. Testing database connection...");
    const result = await db.query(
      "SELECT NOW() as current_time, version() as version"
    );
    console.log("✅ Database connected successfully");
    console.log("   Current time:", result.rows[0].current_time);
    console.log("   PostgreSQL version:", result.rows[0].version.split(" ")[0]);

    console.log("3. Testing table existence...");
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log("✅ Tables found:", tablesResult.rows.length);
    tablesResult.rows.forEach((row) => {
      console.log("   -", row.table_name);
    });

    console.log("4. Testing migrations table...");
    const migrationsResult = await db.query(
      "SELECT * FROM migrations ORDER BY id"
    );
    console.log("✅ Migrations found:", migrationsResult.rows.length);
    migrationsResult.rows.forEach((row) => {
      console.log("   -", row.name, "executed at:", row.executed_at);
    });

    console.log("\n🎉 All tests passed!");
    return true;
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Error details:", {
      code: error.code,
      detail: error.detail,
      hint: error.hint,
    });
    return false;
  }
}

// Run the test
testDatabase()
  .then((success) => {
    if (success) {
      console.log("\n✅ Database is ready for seeding!");
      process.exit(0);
    } else {
      console.log("\n❌ Database needs attention!");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
