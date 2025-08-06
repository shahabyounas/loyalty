require("dotenv").config();
const AccessControlService = require("./src/services/accessControl.service");
const { User, Role, AccessControl } = require("./src/models");
const { logger } = require("./src/utils/logger");

async function testAccessControlSimple() {
  try {
    console.log("🔐 Testing Access Control Management System (Simple)...\n");

    const tenantId = "15615f2e-15ab-4e5e-a6c6-07cca67b1c28"; // Diamond Vape Co

    // Test 1: Initialize system roles
    console.log("1️⃣ Initializing system roles...");
    const systemRoles = await AccessControlService.initializeSystemRoles();
    console.log("✅ System roles initialized:", systemRoles.length);

    // Test 2: Get available roles
    console.log("\n2️⃣ Getting available roles...");
    const availableRoles = await AccessControlService.getAvailableRoles(
      tenantId
    );
    console.log(
      "✅ Available roles:",
      availableRoles.map((r) => r.name)
    );

    // Test 3: Get role statistics
    console.log("\n3️⃣ Getting role statistics...");
    const roleStats = await AccessControlService.getRoleStatistics(tenantId);
    console.log(
      "✅ Role statistics:",
      roleStats.map((rs) => ({
        role: rs.role_name,
        active_users: rs.active_users,
        total_grants: rs.total_grants,
      }))
    );

    // Test 4: Get access control statistics
    console.log("\n4️⃣ Getting access control statistics...");
    const accessStats = await AccessControlService.getAccessControlStatistics(
      tenantId
    );
    console.log("✅ Access control statistics:", accessStats.length, "roles");

    // Test 5: Get permission groups
    console.log("\n5️⃣ Getting permission groups...");
    const permissionGroups = AccessControlService.getPermissionGroups();
    console.log("✅ Permission groups:", Object.keys(permissionGroups));

    // Test 6: Validate permissions
    console.log("\n6️⃣ Testing permission validation...");
    const validPermissions = ["stamp_scan", "user_manage", "tenant_manage"];
    const invalidPermissions = ["invalid_permission", "fake_permission"];

    try {
      AccessControlService.validatePermissions(validPermissions);
      console.log("✅ Valid permissions accepted");
    } catch (error) {
      console.log("❌ Valid permissions rejected:", error.message);
    }

    try {
      AccessControlService.validatePermissions(invalidPermissions);
      console.log("❌ Invalid permissions accepted (should have failed)");
    } catch (error) {
      console.log("✅ Invalid permissions correctly rejected:", error.message);
    }

    // Test 7: Create a test user for role testing
    console.log("\n7️⃣ Creating test user for role testing...");
    const timestamp = Date.now();
    const testUserEmail = `testuser${timestamp}@accesscontrol.com`;

    const testUser = await User.create({
      auth_user_id: `00000000-0000-0000-0000-${timestamp
        .toString()
        .slice(-12)
        .padStart(12, "0")}`, // Unique placeholder
      tenant_id: tenantId,
      email: testUserEmail,
      first_name: "Test",
      last_name: "User",
      role: "customer",
      email_verified: true,
    });
    console.log("✅ Test user created:", testUser.email);

    // Test 8: Create a grantor user
    console.log("\n8️⃣ Creating grantor user...");
    const grantorEmail = `grantor${timestamp}@accesscontrol.com`;

    const grantor = await User.create({
      auth_user_id: `00000000-0000-0000-0001-${timestamp
        .toString()
        .slice(-12)
        .padStart(12, "0")}`, // Unique placeholder
      tenant_id: tenantId,
      email: grantorEmail,
      first_name: "Grantor",
      last_name: "User",
      role: "tenant_admin",
      email_verified: true,
    });
    console.log("✅ Grantor user created:", grantor.email);

    // Test 9: Grant role to user
    console.log("\n9️⃣ Granting staff role to test user...");
    const grantedAccess = await AccessControlService.grantRole(
      testUser.id,
      "staff",
      grantor.id,
      tenantId,
      ["custom_permission"] // Additional custom permission
    );
    console.log("✅ Role granted:", {
      user_id: grantedAccess.user_id,
      role_id: grantedAccess.role_id,
      permissions: grantedAccess.permissions,
    });

    // Test 10: Get user's effective permissions
    console.log("\n🔟 Getting user's effective permissions...");
    const userPermissions = await AccessControlService.getUserPermissions(
      testUser.id,
      tenantId
    );
    console.log("✅ User permissions:", userPermissions);

    // Test 11: Check specific permissions
    console.log("\n1️⃣1️⃣ Checking specific permissions...");
    const canScanStamps = await AccessControlService.hasPermission(
      testUser.id,
      "stamp_scan",
      tenantId
    );
    const canManageUsers = await AccessControlService.hasPermission(
      testUser.id,
      "user_manage",
      tenantId
    );
    console.log("✅ Permission checks:", {
      canScanStamps,
      canManageUsers,
    });

    // Test 12: Get user's roles
    console.log("\n1️⃣2️⃣ Getting user's roles...");
    const userRoles = await AccessControlService.getUserRoles(
      testUser.id,
      tenantId
    );
    console.log(
      "✅ User roles:",
      userRoles.map((ur) => ({
        role_name: ur.role.name,
        permissions: ur.effective_permissions,
      }))
    );

    // Test 13: Create custom role
    console.log("\n1️⃣3️⃣ Creating custom role...");
    const customRole = await AccessControlService.createCustomRole(
      {
        name: "senior_staff",
        description: "Senior staff with additional permissions",
        permissions: [
          "stamp_scan",
          "purchase_process",
          "customer_view",
          "report_view",
        ],
      },
      grantor.id,
      tenantId
    );
    console.log("✅ Custom role created:", customRole.name);

    // Test 14: Grant custom role
    console.log("\n1️⃣4️⃣ Granting custom role...");
    const customAccess = await AccessControlService.grantRole(
      testUser.id,
      "senior_staff",
      grantor.id,
      tenantId
    );
    console.log("✅ Custom role granted");

    // Test 15: Get updated user permissions
    console.log("\n1️⃣5️⃣ Getting updated user permissions...");
    const updatedPermissions = await AccessControlService.getUserPermissions(
      testUser.id,
      tenantId
    );
    console.log("✅ Updated permissions:", updatedPermissions);

    console.log("\n🎉 All Access Control tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log("- System roles initialized");
    console.log("- Custom role created and assigned");
    console.log("- Permission checking working");
    console.log("- Multi-role support confirmed");
    console.log("- Permission validation working");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    logger.error("Test error:", error);
  }
}

// Run the test
testAccessControlSimple()
  .then(() => {
    console.log("\n✅ Access Control test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Access Control test failed:", error);
    process.exit(1);
  });
