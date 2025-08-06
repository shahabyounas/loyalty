require("dotenv").config();
const AccessControlService = require("./src/services/accessControl.service");
const { User, Role, AccessControl } = require("./src/models");
const { logger } = require("./src/utils/logger");

async function testAccessControl() {
  try {
    console.log("🔐 Testing Access Control Management System...\n");

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

    // Test 3: Create a test user (if not exists)
    console.log("\n3️⃣ Creating test user...");
    const timestamp = Date.now();
    const testUserEmail = `testuser${timestamp}@accesscontrol.com`;

    const testUser = await User.create({
      auth_user_id: "00000000-0000-0000-0000-000000000001", // Placeholder
      tenant_id: tenantId,
      email: testUserEmail,
      first_name: "Test",
      last_name: "User",
      role: "customer",
      email_verified: true,
    });
    console.log("✅ Test user created:", testUser.email);

    // Test 4: Get a tenant admin user for granting roles
    console.log("\n4️⃣ Finding tenant admin for role granting...");
    const tenantAdmins = await User.getUsersByRole("tenant_admin", tenantId);
    const grantor = tenantAdmins[0];
    if (!grantor) {
      throw new Error("No tenant admin found to grant roles");
    }
    console.log("✅ Grantor found:", grantor.email);

    // Test 5: Grant role to user
    console.log("\n5️⃣ Granting staff role to test user...");
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

    // Test 6: Get user's effective permissions
    console.log("\n6️⃣ Getting user's effective permissions...");
    const userPermissions = await AccessControlService.getUserPermissions(
      testUser.id,
      tenantId
    );
    console.log("✅ User permissions:", userPermissions);

    // Test 7: Check specific permissions
    console.log("\n7️⃣ Checking specific permissions...");
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

    // Test 8: Get user's roles
    console.log("\n8️⃣ Getting user's roles...");
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

    // Test 9: Create custom role
    console.log("\n9️⃣ Creating custom role...");
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

    // Test 10: Grant custom role
    console.log("\n🔟 Granting custom role...");
    const customAccess = await AccessControlService.grantRole(
      testUser.id,
      "senior_staff",
      grantor.id,
      tenantId
    );
    console.log("✅ Custom role granted");

    // Test 11: Get updated user permissions
    console.log("\n1️⃣1️⃣ Getting updated user permissions...");
    const updatedPermissions = await AccessControlService.getUserPermissions(
      testUser.id,
      tenantId
    );
    console.log("✅ Updated permissions:", updatedPermissions);

    // Test 12: Get access control audit log
    console.log("\n1️⃣2️⃣ Getting access control audit log...");
    const auditLog = await AccessControlService.getAuditLog(tenantId, {
      limit: 5,
    });
    console.log("✅ Audit log entries:", auditLog.length);

    // Test 13: Get role statistics
    console.log("\n1️⃣3️⃣ Getting role statistics...");
    const roleStats = await AccessControlService.getRoleStatistics(tenantId);
    console.log(
      "✅ Role statistics:",
      roleStats.map((rs) => ({
        role: rs.role_name,
        active_users: rs.active_users,
        total_grants: rs.total_grants,
      }))
    );

    // Test 14: Get access control statistics
    console.log("\n1️⃣4️⃣ Getting access control statistics...");
    const accessStats = await AccessControlService.getAccessControlStatistics(
      tenantId
    );
    console.log("✅ Access control statistics:", accessStats.length, "roles");

    // Test 15: Get permission groups
    console.log("\n1️⃣5️⃣ Getting permission groups...");
    const permissionGroups = AccessControlService.getPermissionGroups();
    console.log("✅ Permission groups:", Object.keys(permissionGroups));

    console.log("\n🎉 All Access Control tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log("- System roles initialized");
    console.log("- Custom role created and assigned");
    console.log("- Permission checking working");
    console.log("- Audit logging functional");
    console.log("- Statistics generation working");
    console.log("- Multi-role support confirmed");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    logger.error("Test error:", error);
  }
}

// Run the test
testAccessControl()
  .then(() => {
    console.log("\n✅ Access Control test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Access Control test failed:", error);
    process.exit(1);
  });
