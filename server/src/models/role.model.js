const { db } = require("../config/database");
const { logger } = require("../utils/logger");

class Role {
  constructor(data) {
    this.id = data.id;
    this.tenant_id = data.tenant_id;
    this.name = data.name;
    this.description = data.description;
    this.permissions = data.permissions || [];
    this.is_system_role = data.is_system_role || false;
    this.is_active = data.is_active !== false;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Create a new role
   */
  static async create(roleData) {
    try {
      const query = `
        INSERT INTO roles (
          tenant_id, name, description, permissions, is_system_role, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const params = [
        roleData.tenant_id,
        roleData.name,
        roleData.description,
        JSON.stringify(roleData.permissions || []),
        roleData.is_system_role || false,
        roleData.is_active !== false,
      ];

      const result = await db.getOne(query, params);
      return new Role(result);
    } catch (error) {
      logger.error("Error creating role:", error);
      throw error;
    }
  }

  /**
   * Find role by ID
   */
  static async findById(id, tenantId = null) {
    try {
      let query = "SELECT * FROM roles WHERE id = $1";
      const params = [id];

      if (tenantId) {
        query += " AND (tenant_id = $2 OR tenant_id IS NULL)";
        params.push(tenantId);
      }

      const result = await db.getOne(query, params);
      return result ? new Role(result) : null;
    } catch (error) {
      logger.error("Error finding role by ID:", error);
      throw error;
    }
  }

  /**
   * Find role by name
   */
  static async findByName(name, tenantId = null) {
    try {
      let query = "SELECT * FROM roles WHERE name = $1";
      const params = [name];

      if (tenantId) {
        query += " AND (tenant_id = $2 OR tenant_id IS NULL)";
        params.push(tenantId);
      }

      const result = await db.getOne(query, params);
      return result ? new Role(result) : null;
    } catch (error) {
      logger.error("Error finding role by name:", error);
      throw error;
    }
  }

  /**
   * Find all roles for a tenant
   */
  static async findByTenantId(tenantId, options = {}) {
    try {
      let query =
        "SELECT * FROM roles WHERE (tenant_id = $1 OR tenant_id IS NULL)";
      const params = [tenantId];
      let paramCount = 2;

      if (options.is_active !== undefined) {
        query += ` AND is_active = $${paramCount}`;
        params.push(options.is_active);
        paramCount++;
      }

      if (options.is_system_role !== undefined) {
        query += ` AND is_system_role = $${paramCount}`;
        params.push(options.is_system_role);
        paramCount++;
      }

      if (options.search) {
        query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${options.search}%`);
        paramCount++;
      }

      query += " ORDER BY is_system_role DESC, name ASC";

      if (options.limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(options.limit);
        paramCount++;
      }

      if (options.offset) {
        query += ` OFFSET $${paramCount}`;
        params.push(options.offset);
      }

      const results = await db.getMany(query, params);
      return results.map((row) => new Role(row));
    } catch (error) {
      logger.error("Error finding roles by tenant ID:", error);
      throw error;
    }
  }

  /**
   * Update role
   */
  static async update(id, updateData, tenantId = null) {
    try {
      let query = "UPDATE roles SET";
      const params = [];
      let paramCount = 1;
      const updates = [];

      if (updateData.name !== undefined) {
        updates.push(` name = $${paramCount}`);
        params.push(updateData.name);
        paramCount++;
      }

      if (updateData.description !== undefined) {
        updates.push(` description = $${paramCount}`);
        params.push(updateData.description);
        paramCount++;
      }

      if (updateData.permissions !== undefined) {
        updates.push(` permissions = $${paramCount}`);
        params.push(JSON.stringify(updateData.permissions));
        paramCount++;
      }

      if (updateData.is_active !== undefined) {
        updates.push(` is_active = $${paramCount}`);
        params.push(updateData.is_active);
        paramCount++;
      }

      if (updates.length === 0) {
        throw new Error("No updates provided");
      }

      updates.push(` updated_at = CURRENT_TIMESTAMP`);
      query += updates.join(", ");
      query += ` WHERE id = $${paramCount}`;
      params.push(id);
      paramCount++;

      if (tenantId) {
        query += ` AND (tenant_id = $${paramCount} OR tenant_id IS NULL)`;
        params.push(tenantId);
      }

      query += " RETURNING *";

      const result = await db.getOne(query, params);
      return result ? new Role(result) : null;
    } catch (error) {
      logger.error("Error updating role:", error);
      throw error;
    }
  }

  /**
   * Delete role (soft delete)
   */
  static async delete(id, tenantId = null) {
    try {
      let query =
        "UPDATE roles SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1";
      const params = [id];

      if (tenantId) {
        query += " AND (tenant_id = $2 OR tenant_id IS NULL)";
        params.push(tenantId);
      }

      query += " RETURNING *";

      const result = await db.getOne(query, params);
      return result ? new Role(result) : null;
    } catch (error) {
      logger.error("Error deleting role:", error);
      throw error;
    }
  }

  /**
   * Get system roles (available to all tenants)
   */
  static async getSystemRoles() {
    try {
      const query =
        "SELECT * FROM roles WHERE is_system_role = true AND is_active = true ORDER BY name";
      const results = await db.getMany(query);
      return results.map((row) => new Role(row));
    } catch (error) {
      logger.error("Error getting system roles:", error);
      throw error;
    }
  }

  /**
   * Get custom roles for a tenant
   */
  static async getCustomRoles(tenantId) {
    try {
      const query = `
        SELECT * FROM roles 
        WHERE tenant_id = $1 AND is_system_role = false AND is_active = true 
        ORDER BY name
      `;
      const results = await db.getMany(query, [tenantId]);
      return results.map((row) => new Role(row));
    } catch (error) {
      logger.error("Error getting custom roles:", error);
      throw error;
    }
  }

  /**
   * Get all available roles for a tenant (system + custom)
   */
  static async getAllAvailableRoles(tenantId) {
    try {
      const systemRoles = await this.getSystemRoles();
      const customRoles = await this.getCustomRoles(tenantId);
      return [...systemRoles, ...customRoles];
    } catch (error) {
      logger.error("Error getting all available roles:", error);
      throw error;
    }
  }

  /**
   * Create default system roles
   */
  static async createDefaultSystemRoles() {
    try {
      const defaultRoles = [
        {
          name: "super_admin",
          description: "System-wide administrator with full access",
          permissions: ["*"],
          is_system_role: true,
        },
        {
          name: "tenant_admin",
          description: "Tenant administrator with full tenant access",
          permissions: [
            "tenant_manage",
            "user_manage",
            "store_manage",
            "loyalty_manage",
            "reward_manage",
            "report_view",
            "stamp_scan",
            "purchase_process",
          ],
          is_system_role: true,
        },
        {
          name: "store_manager",
          description: "Store manager with store-level access",
          permissions: [
            "store_manage",
            "staff_manage",
            "stamp_scan",
            "purchase_process",
            "report_view",
            "customer_view",
          ],
          is_system_role: true,
        },
        {
          name: "staff",
          description: "Store staff with basic operational access",
          permissions: ["stamp_scan", "purchase_process", "customer_view"],
          is_system_role: true,
        },
        {
          name: "customer",
          description: "Customer with limited access",
          permissions: ["profile_view", "loyalty_view", "reward_redeem"],
          is_system_role: true,
        },
      ];

      const createdRoles = [];
      for (const roleData of defaultRoles) {
        try {
          const existingRole = await this.findByName(roleData.name);
          if (!existingRole) {
            const role = await this.create(roleData);
            createdRoles.push(role);
          }
        } catch (error) {
          logger.error(`Error creating default role ${roleData.name}:`, error);
        }
      }

      return createdRoles;
    } catch (error) {
      logger.error("Error creating default system roles:", error);
      throw error;
    }
  }

  /**
   * Get role usage statistics
   */
  static async getUsageStatistics(tenantId) {
    try {
      const query = `
        SELECT 
          r.id,
          r.name,
          r.description,
          COUNT(ac.id) as assigned_users,
          COUNT(CASE WHEN ac.is_active = true THEN 1 END) as active_users
        FROM roles r
        LEFT JOIN access_controls ac ON r.id = ac.role_id AND ac.tenant_id = $1
        WHERE (r.tenant_id = $1 OR r.tenant_id IS NULL) AND r.is_active = true
        GROUP BY r.id, r.name, r.description
        ORDER BY r.is_system_role DESC, r.name
      `;

      const results = await db.getMany(query, [tenantId]);
      return results;
    } catch (error) {
      logger.error("Error getting role usage statistics:", error);
      throw error;
    }
  }

  /**
   * Check if role has specific permission
   */
  hasPermission(permission) {
    return (
      this.permissions.includes(permission) || this.permissions.includes("*")
    );
  }

  /**
   * Check if role has any of the specified permissions
   */
  hasAnyPermission(permissions) {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  /**
   * Check if role has all of the specified permissions
   */
  hasAllPermissions(permissions) {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  /**
   * Get formatted role name
   */
  getDisplayName() {
    return this.name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      tenant_id: this.tenant_id,
      name: this.name,
      description: this.description,
      permissions: this.permissions,
      is_system_role: this.is_system_role,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Role;
