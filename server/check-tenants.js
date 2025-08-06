require("dotenv").config();
const { db } = require("./src/config/database");

async function checkTenants() {
  try {
    console.log("🔍 Checking available tenants...\n");

    const result = await db.query(
      "SELECT id, business_name, subscription_plan FROM tenants LIMIT 5"
    );

    console.log("Available tenants:");
    result.rows.forEach((tenant, index) => {
      console.log(
        `${index + 1}. ${tenant.business_name} (${tenant.subscription_plan})`
      );
      console.log(`   ID: ${tenant.id}`);
      console.log("");
    });

    if (result.rows.length === 0) {
      console.log("❌ No tenants found. Please run the seeder first:");
      console.log("   npm run db:seed");
    }
  } catch (error) {
    console.error("❌ Error checking tenants:", error.message);
  } finally {
    await db.close();
  }
}

checkTenants();
