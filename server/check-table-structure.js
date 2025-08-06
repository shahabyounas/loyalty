require("dotenv").config();
const { db } = require("./src/config/database");

async function checkTableStructure() {
  try {
    console.log("🔍 Checking customer_loyalty table structure...");

    const result = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'customer_loyalty' 
      ORDER BY ordinal_position
    `);

    console.log("\n📋 customer_loyalty table columns:");
    result.rows.forEach((row) => {
      console.log(
        `  - ${row.column_name}: ${row.data_type} ${
          row.is_nullable === "YES" ? "(nullable)" : "(not null)"
        } ${row.column_default ? `default: ${row.column_default}` : ""}`
      );
    });

    console.log(`\n✅ Total columns: ${result.rows.length}`);
  } catch (error) {
    console.error("❌ Error checking table structure:", error);
  }
}

checkTableStructure()
  .then(() => {
    console.log("\n✅ Table structure check completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Table structure check failed:", error);
    process.exit(1);
  });
