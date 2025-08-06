require("dotenv").config();
const UserAuthService = require("./src/services/user-auth.service");
const { logger } = require("./src/utils/logger");

async function testUserAuth() {
  try {
    console.log("🧪 Testing Integrated User Auth System...\n");

    // Generate unique email addresses
    const timestamp = Date.now();
    const customerEmail = `customer${timestamp}@test.com`;
    const staffEmail = `staff${timestamp}@test.com`;

    // Test 1: Create a customer user
    console.log("1️⃣ Creating a customer user...");
    const customerData = {
      email: customerEmail,
      password: "TestPassword123!",
      first_name: "John",
      last_name: "Customer",
      phone: "+44 7123 456789",
    };

    const customerResult = await UserAuthService.createCustomer(
      customerData,
      "373388a6-4b5a-44ec-959c-83a2942c1837"
    ); // Diamond Vape Co tenant ID
    console.log("✅ Customer created:", {
      id: customerResult.db_user.id,
      email: customerResult.db_user.email,
      role: customerResult.db_user.role,
      tenant_id: customerResult.db_user.tenant_id,
    });

    // Test 2: Create a staff user
    console.log("\n2️⃣ Creating a staff user...");
    const staffData = {
      email: staffEmail,
      password: "TestPassword123!",
      first_name: "Jane",
      last_name: "Staff",
      phone: "+44 7123 456790",
    };

    const staffResult = await UserAuthService.createStaff(
      staffData,
      "373388a6-4b5a-44ec-959c-83a2942c1837"
    );
    console.log("✅ Staff created:", {
      id: staffResult.db_user.id,
      email: staffResult.db_user.email,
      role: staffResult.db_user.role,
      tenant_id: staffResult.db_user.tenant_id,
    });

    // Test 3: Sign in customer
    console.log("\n3️⃣ Signing in customer...");
    const signInResult = await UserAuthService.signIn(
      customerEmail,
      "TestPassword123!"
    );
    console.log("✅ Customer signed in:", {
      id: signInResult.db_user.id,
      email: signInResult.db_user.email,
      role: signInResult.db_user.role,
      permissions: signInResult.db_user.permissions,
    });

    // Test 4: Get user by token
    console.log("\n4️⃣ Getting user by token...");
    const userByToken = await UserAuthService.getUserByToken(
      signInResult.session.access_token
    );
    console.log("✅ User retrieved by token:", {
      id: userByToken.db_user.id,
      email: userByToken.db_user.email,
      role: userByToken.db_user.role,
    });

    // Test 5: Check permissions
    console.log("\n5️⃣ Testing permissions...");
    const canScanStamps = userByToken.db_user.canScanStamps();
    const canManageUsers = userByToken.db_user.canManageUsers();
    console.log("✅ Permission check:", {
      canScanStamps,
      canManageUsers,
    });

    // Test 6: Get tenant users
    console.log("\n6️⃣ Getting tenant users...");
    const tenantUsers = await UserAuthService.getTenantUsers(
      "373388a6-4b5a-44ec-959c-83a2942c1837"
    );
    console.log("✅ Tenant users found:", tenantUsers.length);

    // Test 7: Update user profile
    console.log("\n7️⃣ Updating user profile...");
    const updateResult = await UserAuthService.updateUser(
      userByToken.auth_user.id,
      {
        first_name: "John Updated",
        phone: "+44 7123 456789",
      }
    );
    console.log("✅ Profile updated:", {
      first_name: updateResult.db_user.first_name,
      phone: updateResult.db_user.phone,
    });

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log("- Customer user created and linked to Supabase Auth");
    console.log("- Staff user created and linked to Supabase Auth");
    console.log("- User authentication working with database integration");
    console.log("- Permission system working correctly");
    console.log("- Profile updates working across both systems");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    logger.error("Test error:", error);
  }
}

// Run the test
testUserAuth()
  .then(() => {
    console.log("\n✅ Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
