const AccessControl = require("../models/accessControl.model");
const Role = require("../models/role.model");
const { User } = require("../models");
const { logger } = require("../utils/logger");

class AccessControlService {
  /**
   * Grant role to user
   */
  static async grantRole(
    userId,
    roleName,
    grantedBy,
    tenantId,
    customPermissions = []
  ) {
    try {
      // Find the role
      const role = await Role.findByName(roleName, tenantId);
      if (!role) {
        throw new Error(`Role '${roleName}' not found`);
      }

      // Check if user exists
      const user = await User.findById(userId, tenantId);
      if (!user) {
        throw new Error("User not found");
      }

      // Check if grantor has permission to grant this role
      const grantor = await User.findById(grantedBy, tenantId);
      if (!grantor) {
        throw new Error("Grantor not found");
      }

      if (!grantor.hasPermission("user_manage")) {
        throw new Error("Insufficient permissions to grant roles");
      }

      // Combine role permissions with custom permissions
      const effectivePermissions = [...role.permissions, ...customPermissions];

      // Grant the role
      const accessControl = await AccessControl.grantRole(
        userId,
        role.id,
        grantedBy,
        tenantId,
        effectivePermissions
      );

      logger.info(
        `Role '${roleName}' granted to user ${userId} by ${grantedBy}`
      );
      return accessControl;
    } catch (error) {
      logger.error("Error granting role:", error);
      throw error;
    }
  }

  /**
   * Revoke role from user
   */
  static async revokeRole(
    accessControlId,
    revokedBy,
    reason = null,
    tenantId = null
  ) {
    try {
      // Check if revoker has permission
      const revoker = await User.findById(revokedBy, tenantId);
      if (!revoker) {
        throw new Error("Revoker not found");
      }

      if (!revoker.hasPermission("user_manage")) {
        throw new Error("Insufficient permissions to revoke roles");
      }

      // Revoke the access control
      const revokedAccess = await AccessControl.revoke(
        accessControlId,
        revokedBy,
        reason,
        tenantId
      );

      logger.info(
        `Role revoked from access control ${accessControlId} by ${revokedBy}`
      );
      return revokedAccess;
    } catch (error) {
      logger.error("Error revoking role:", error);
      throw error;
    }
  }

  /**
   * Get user's effective permissions
   */
  static async getUserPermissions(userId, tenantId = null) {
    try {
      const permissions = await AccessControl.getUserPermissions(
        userId,
        tenantId
      );
      return permissions;
    } catch (error) {
      logger.error("Error getting user permissions:", error);
      throw error;
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(userId, permission, tenantId = null) {
    try {
      const hasPermission = await AccessControl.hasPermission(
        userId,
        permission,
        tenantId
      );
      return hasPermission;
    } catch (error) {
      logger.error("Error checking user permission:", error);
      throw error;
    }
  }

  /**
   * Get user's roles and permissions
   */
  static async getUserRoles(userId, tenantId = null) {
    try {
      const accessControls = await AccessControl.findByUserId(userId, tenantId);
      const roles = [];

      for (const access of accessControls) {
        const role = await Role.findById(access.role_id);
        if (role) {
          roles.push({
            role: role,
            access_control: access,
            effective_permissions: access.permissions,
          });
        }
      }

      return roles;
    } catch (error) {
      logger.error("Error getting user roles:", error);
      throw error;
    }
  }

  /**
   * Get all access controls for a tenant
   */
  static async getTenantAccessControls(tenantId, options = {}) {
    try {
      const accessControls = await AccessControl.findByTenantId(
        tenantId,
        options
      );
      return accessControls;
    } catch (error) {
      logger.error("Error getting tenant access controls:", error);
      throw error;
    }
  }

  /**
   * Get access control audit log
   */
  static async getAuditLog(tenantId, options = {}) {
    try {
      const auditLog = await AccessControl.getAuditLog(tenantId, options);
      return auditLog;
    } catch (error) {
      logger.error("Error getting access control audit log:", error);
      throw error;
    }
  }

  /**
   * Bulk grant roles to users
   */
  static async bulkGrantRoles(grants, grantedBy, tenantId) {
    try {
      // Validate grantor permissions
      const grantor = await User.findById(grantedBy, tenantId);
      if (!grantor || !grantor.hasPermission("user_manage")) {
        throw new Error("Insufficient permissions to grant roles");
      }

      const results = await AccessControl.bulkGrantRoles(
        grants,
        grantedBy,
        tenantId
      );
      return results;
    } catch (error) {
      logger.error("Error bulk granting roles:", error);
      throw error;
    }
  }

  /**
   * Create custom role
   */
  static async createCustomRole(roleData, createdBy, tenantId) {
    try {
      // Check if creator has permission
      const creator = await User.findById(createdBy, tenantId);
      if (!creator || !creator.hasPermission("user_manage")) {
        throw new Error("Insufficient permissions to create roles");
      }

      // Check if role name already exists
      const existingRole = await Role.findByName(roleData.name, tenantId);
      if (existingRole) {
        throw new Error(`Role '${roleData.name}' already exists`);
      }

      // Create the role
      const role = await Role.create({
        ...roleData,
        tenant_id: tenantId,
        is_system_role: false,
      });

      logger.info(`Custom role '${roleData.name}' created by ${createdBy}`);
      return role;
    } catch (error) {
      logger.error("Error creating custom role:", error);
      throw error;
    }
  }

  /**
   * Update custom role
   */
  static async updateCustomRole(roleId, updateData, updatedBy, tenantId) {
    try {
      // Check if updater has permission
      const updater = await User.findById(updatedBy, tenantId);
      if (!updater || !updater.hasPermission("user_manage")) {
        throw new Error("Insufficient permissions to update roles");
      }

      // Check if role exists and is custom
      const role = await Role.findById(roleId, tenantId);
      if (!role) {
        throw new Error("Role not found");
      }

      if (role.is_system_role) {
        throw new Error("Cannot modify system roles");
      }

      // Update the role
      const updatedRole = await Role.update(roleId, updateData, tenantId);

      logger.info(`Custom role '${role.name}' updated by ${updatedBy}`);
      return updatedRole;
    } catch (error) {
      logger.error("Error updating custom role:", error);
      throw error;
    }
  }

  /**
   * Delete custom role
   */
  static async deleteCustomRole(roleId, deletedBy, tenantId) {
    try {
      // Check if deleter has permission
      const deleter = await User.findById(deletedBy, tenantId);
      if (!deleter || !deleter.hasPermission("user_manage")) {
        throw new Error("Insufficient permissions to delete roles");
      }

      // Check if role exists and is custom
      const role = await Role.findById(roleId, tenantId);
      if (!role) {
        throw new Error("Role not found");
      }

      if (role.is_system_role) {
        throw new Error("Cannot delete system roles");
      }

      // Check if role is assigned to any users
      const accessControls = await AccessControl.findByTenantId(tenantId, {
        role_id: roleId,
      });
      if (accessControls.length > 0) {
        throw new Error("Cannot delete role that is assigned to users");
      }

      // Delete the role
      const deletedRole = await Role.delete(roleId, tenantId);

      logger.info(`Custom role '${role.name}' deleted by ${deletedBy}`);
      return deletedRole;
    } catch (error) {
      logger.error("Error deleting custom role:", error);
      throw error;
    }
  }

  /**
   * Get role statistics
   */
  static async getRoleStatistics(tenantId) {
    try {
      const statistics = await Role.getUsageStatistics(tenantId);
      return statistics;
    } catch (error) {
      logger.error("Error getting role statistics:", error);
      throw error;
    }
  }

  /**
   * Get access control statistics
   */
  static async getAccessControlStatistics(tenantId) {
    try {
      const statistics = await AccessControl.getRoleStatistics(tenantId);
      return statistics;
    } catch (error) {
      logger.error("Error getting access control statistics:", error);
      throw error;
    }
  }

  /**
   * Initialize default system roles
   */
  static async initializeSystemRoles() {
    try {
      const createdRoles = await Role.createDefaultSystemRoles();
      logger.info(`Initialized ${createdRoles.length} system roles`);
      return createdRoles;
    } catch (error) {
      logger.error("Error initializing system roles:", error);
      throw error;
    }
  }

  /**
   * Get all available roles for a tenant
   */
  static async getAvailableRoles(tenantId) {
    try {
      const roles = await Role.getAllAvailableRoles(tenantId);
      return roles;
    } catch (error) {
      logger.error("Error getting available roles:", error);
      throw error;
    }
  }

  /**
   * Validate permissions
   */
  static validatePermissions(permissions) {
    const validPermissions = [
      // System permissions
      "*",

      // Tenant management
      "tenant_manage",
      "tenant_view",

      // User management
      "user_manage",
      "user_view",
      "user_create",
      "user_update",
      "user_delete",

      // Store management
      "store_manage",
      "store_view",
      "store_create",
      "store_update",
      "store_delete",

      // Staff management
      "staff_manage",
      "staff_view",
      "staff_assign",
      "staff_remove",

      // Loyalty management
      "loyalty_manage",
      "loyalty_view",
      "loyalty_create",
      "loyalty_update",

      // Reward management
      "reward_manage",
      "reward_view",
      "reward_create",
      "reward_update",
      "reward_delete",
      "reward_redeem",

      // Stamp management
      "stamp_scan",
      "stamp_view",
      "stamp_create",

      // Purchase management
      "purchase_process",
      "purchase_view",
      "purchase_create",

      // Customer management
      "customer_view",
      "customer_create",
      "customer_update",

      // Reporting
      "report_view",
      "report_create",
      "report_export",

      // Profile management
      "profile_view",
      "profile_update",

      // Role management
      "role_manage",
      "role_view",
      "role_create",
      "role_update",
      "role_delete",
    ];

    const invalidPermissions = permissions.filter(
      (permission) => !validPermissions.includes(permission)
    );
    if (invalidPermissions.length > 0) {
      throw new Error(`Invalid permissions: ${invalidPermissions.join(", ")}`);
    }

    return true;
  }

  /**
   * Get permission groups for UI
   */
  static getPermissionGroups() {
    return {
      system: {
        name: "System",
        permissions: ["*"],
      },
      tenant: {
        name: "Tenant Management",
        permissions: ["tenant_manage", "tenant_view"],
      },
      user: {
        name: "User Management",
        permissions: [
          "user_manage",
          "user_view",
          "user_create",
          "user_update",
          "user_delete",
        ],
      },
      store: {
        name: "Store Management",
        permissions: [
          "store_manage",
          "store_view",
          "store_create",
          "store_update",
          "store_delete",
        ],
      },
      staff: {
        name: "Staff Management",
        permissions: [
          "staff_manage",
          "staff_view",
          "staff_assign",
          "staff_remove",
        ],
      },
      loyalty: {
        name: "Loyalty Management",
        permissions: [
          "loyalty_manage",
          "loyalty_view",
          "loyalty_create",
          "loyalty_update",
        ],
      },
      reward: {
        name: "Reward Management",
        permissions: [
          "reward_manage",
          "reward_view",
          "reward_create",
          "reward_update",
          "reward_delete",
          "reward_redeem",
        ],
      },
      stamp: {
        name: "Stamp Management",
        permissions: ["stamp_scan", "stamp_view", "stamp_create"],
      },
      purchase: {
        name: "Purchase Management",
        permissions: ["purchase_process", "purchase_view", "purchase_create"],
      },
      customer: {
        name: "Customer Management",
        permissions: ["customer_view", "customer_create", "customer_update"],
      },
      report: {
        name: "Reporting",
        permissions: ["report_view", "report_create", "report_export"],
      },
      profile: {
        name: "Profile Management",
        permissions: ["profile_view", "profile_update"],
      },
      role: {
        name: "Role Management",
        permissions: [
          "role_manage",
          "role_view",
          "role_create",
          "role_update",
          "role_delete",
        ],
      },
    };
  }
}

module.exports = AccessControlService;
