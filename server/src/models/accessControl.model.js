const { db } = require("../config/database");
const { logger } = require("../utils/logger");

class AccessControl {
  constructor(data) {
    this.id = data.id;
    this.tenant_id = data.tenant_id;
    this.user_id = data.user_id;
    this.role_id = data.role_id;
    this.permissions = data.permissions || [];
    this.is_active = data.is_active !== false;
    this.granted_by = data.granted_by;
    this.granted_at = data.granted_at || new Date();
    this.expires_at = data.expires_at;
    this.revoked_by = data.revoked_by;
    this.revoked_at = data.revoked_at;
    this.revocation_reason = data.revocation_reason;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Create a new access control entry
   */
  static async create(accessData) {
    try {
      const query = `
        INSERT INTO access_controls (
          tenant_id, user_id, role_id, permissions, is_active,
          granted_by, granted_at, expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const params = [
        accessData.tenant_id,
        accessData.user_id,
        accessData.role_id,
        JSON.stringify(accessData.permissions || []),
        accessData.is_active !== false,
        accessData.granted_by,
        accessData.granted_at || new Date(),
        accessData.expires_at,
      ];

      const result = await db.getOne(query, params);
      return new AccessControl(result);
    } catch (error) {
      logger.error("Error creating access control:", error);
      throw error;
    }
  }

  /**
   * Find access control by ID
   */
  static async findById(id, tenantId = null) {
    try {
      let query = "SELECT * FROM access_controls WHERE id = $1";
      const params = [id];

      if (tenantId) {
        query += " AND tenant_id = $2";
        params.push(tenantId);
      }

      const result = await db.getOne(query, params);
      return result ? new AccessControl(result) : null;
    } catch (error) {
      logger.error("Error finding access control by ID:", error);
      throw error;
    }
  }

  /**
   * Find access controls for a user
   */
  static async findByUserId(userId, tenantId = null) {
    try {
      let query =
        "SELECT * FROM access_controls WHERE user_id = $1 AND is_active = true";
      const params = [userId];

      if (tenantId) {
        query += " AND tenant_id = $2";
        params.push(tenantId);
      }

      query += " ORDER BY granted_at DESC";

      const results = await db.getMany(query, params);
      return results.map((row) => new AccessControl(row));
    } catch (error) {
      logger.error("Error finding access controls by user ID:", error);
      throw error;
    }
  }

  /**
   * Find active access controls for a tenant
   */
  static async findByTenantId(tenantId, options = {}) {
    try {
      let query = `
        SELECT ac.*, u.email, u.first_name, u.last_name, r.name as role_name
        FROM access_controls ac
        JOIN users u ON ac.user_id = u.id
        JOIN roles r ON ac.role_id = r.id
        WHERE ac.tenant_id = $1 AND ac.is_active = true
      `;
      const params = [tenantId];
      let paramCount = 2;

      if (options.role_id) {
        query += ` AND ac.role_id = $${paramCount}`;
        params.push(options.role_id);
        paramCount++;
      }

      if (options.granted_by) {
        query += ` AND ac.granted_by = $${paramCount}`;
        params.push(options.granted_by);
        paramCount++;
      }

      if (options.search) {
        query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
        params.push(`%${options.search}%`);
        paramCount++;
      }

      query += " ORDER BY ac.granted_at DESC";

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
      return results.map((row) => ({
        ...new AccessControl(row),
        user_email: row.email,
        user_name: `${row.first_name} ${row.last_name}`,
        role_name: row.role_name,
      }));
    } catch (error) {
      logger.error("Error finding access controls by tenant ID:", error);
      throw error;
    }
  }

  /**
   * Update access control
   */
  static async update(id, updateData, tenantId = null) {
    try {
      let query = "UPDATE access_controls SET";
      const params = [];
      let paramCount = 1;
      const updates = [];

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

      if (updateData.expires_at !== undefined) {
        updates.push(` expires_at = $${paramCount}`);
        params.push(updateData.expires_at);
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
        query += ` AND tenant_id = $${paramCount}`;
        params.push(tenantId);
      }

      query += " RETURNING *";

      const result = await db.getOne(query, params);
      return result ? new AccessControl(result) : null;
    } catch (error) {
      logger.error("Error updating access control:", error);
      throw error;
    }
  }

  /**
   * Revoke access control
   */
  static async revoke(id, revokedBy, reason = null, tenantId = null) {
    try {
      let query = `
        UPDATE access_controls 
        SET is_active = false, revoked_by = $2, revoked_at = CURRENT_TIMESTAMP, 
            revocation_reason = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      const params = [id, revokedBy, reason];

      if (tenantId) {
        query += " AND tenant_id = $4";
        params.push(tenantId);
      }

      query += " RETURNING *";

      const result = await db.getOne(query, params);
      return result ? new AccessControl(result) : null;
    } catch (error) {
      logger.error("Error revoking access control:", error);
      throw error;
    }
  }

  /**
   * Grant role to user
   */
  static async grantRole(
    userId,
    roleId,
    grantedBy,
    tenantId,
    permissions = []
  ) {
    try {
      // Check if user already has this role
      const existingAccess = await this.findByUserIdAndRole(
        userId,
        roleId,
        tenantId
      );
      if (existingAccess && existingAccess.is_active) {
        throw new Error("User already has this role");
      }

      const accessData = {
        tenant_id: tenantId,
        user_id: userId,
        role_id: roleId,
        permissions: permissions,
        granted_by: grantedBy,
        is_active: true,
      };

      return await this.create(accessData);
    } catch (error) {
      logger.error("Error granting role:", error);
      throw error;
    }
  }

  /**
   * Find access control by user and role
   */
  static async findByUserIdAndRole(userId, roleId, tenantId = null) {
    try {
      let query =
        "SELECT * FROM access_controls WHERE user_id = $1 AND role_id = $2";
      const params = [userId, roleId];

      if (tenantId) {
        query += " AND tenant_id = $3";
        params.push(tenantId);
      }

      query += " ORDER BY granted_at DESC LIMIT 1";

      const result = await db.getOne(query, params);
      return result ? new AccessControl(result) : null;
    } catch (error) {
      logger.error("Error finding access control by user and role:", error);
      throw error;
    }
  }

  /**
   * Get user's effective permissions
   */
  static async getUserPermissions(userId, tenantId = null) {
    try {
      const accessControls = await this.findByUserId(userId, tenantId);

      // Combine all permissions from active access controls
      const allPermissions = new Set();

      accessControls.forEach((access) => {
        if (
          access.is_active &&
          (!access.expires_at || new Date() < access.expires_at)
        ) {
          access.permissions.forEach((permission) =>
            allPermissions.add(permission)
          );
        }
      });

      return Array.from(allPermissions);
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
      const permissions = await this.getUserPermissions(userId, tenantId);
      return permissions.includes(permission) || permissions.includes("*");
    } catch (error) {
      logger.error("Error checking user permission:", error);
      throw error;
    }
  }

  /**
   * Get access control audit log
   */
  static async getAuditLog(tenantId, options = {}) {
    try {
      let query = `
        SELECT ac.*, 
               u.email as user_email, 
               u.first_name, 
               u.last_name,
               r.name as role_name,
               g.email as granted_by_email,
               g.first_name as granted_by_first_name,
               g.last_name as granted_by_last_name,
               rv.email as revoked_by_email,
               rv.first_name as revoked_by_first_name,
               rv.last_name as revoked_by_last_name
        FROM access_controls ac
        JOIN users u ON ac.user_id = u.id
        JOIN roles r ON ac.role_id = r.id
        LEFT JOIN users g ON ac.granted_by = g.id
        LEFT JOIN users rv ON ac.revoked_by = rv.id
        WHERE ac.tenant_id = $1
      `;
      const params = [tenantId];
      let paramCount = 2;

      if (options.user_id) {
        query += ` AND ac.user_id = $${paramCount}`;
        params.push(options.user_id);
        paramCount++;
      }

      if (options.role_id) {
        query += ` AND ac.role_id = $${paramCount}`;
        params.push(options.role_id);
        paramCount++;
      }

      if (options.is_active !== undefined) {
        query += ` AND ac.is_active = $${paramCount}`;
        params.push(options.is_active);
        paramCount++;
      }

      query += " ORDER BY ac.created_at DESC";

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
      return results.map((row) => ({
        ...new AccessControl(row),
        user_email: row.user_email,
        user_name: `${row.first_name} ${row.last_name}`,
        role_name: row.role_name,
        granted_by_email: row.granted_by_email,
        granted_by_name: row.granted_by_email
          ? `${row.granted_by_first_name} ${row.granted_by_last_name}`
          : null,
        revoked_by_email: row.revoked_by_email,
        revoked_by_name: row.revoked_by_email
          ? `${row.revoked_by_first_name} ${row.revoked_by_last_name}`
          : null,
      }));
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
      const results = [];

      for (const grant of grants) {
        try {
          const accessControl = await this.grantRole(
            grant.user_id,
            grant.role_id,
            grantedBy,
            tenantId,
            grant.permissions || []
          );
          results.push({ success: true, access_control: accessControl });
        } catch (error) {
          results.push({
            success: false,
            user_id: grant.user_id,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      logger.error("Error bulk granting roles:", error);
      throw error;
    }
  }

  /**
   * Get role statistics for a tenant
   */
  static async getRoleStatistics(tenantId) {
    try {
      const query = `
        SELECT 
          r.id as role_id,
          r.name as role_name,
          COUNT(CASE WHEN ac.is_active = true THEN 1 END) as active_users,
          COUNT(CASE WHEN ac.is_active = false THEN 1 END) as revoked_users,
          COUNT(*) as total_grants
        FROM roles r
        LEFT JOIN access_controls ac ON r.id = ac.role_id AND ac.tenant_id = $1
        WHERE r.tenant_id = $1 OR r.tenant_id IS NULL
        GROUP BY r.id, r.name
        ORDER BY r.name
      `;

      const results = await db.getMany(query, [tenantId]);
      return results;
    } catch (error) {
      logger.error("Error getting role statistics:", error);
      throw error;
    }
  }

  /**
   * Check if access control is expired
   */
  isExpired() {
    return this.expires_at && new Date() > this.expires_at;
  }

  /**
   * Check if access control is active and not expired
   */
  isActive() {
    return this.is_active && !this.isExpired();
  }

  /**
   * Get formatted user name
   */
  getUserName() {
    return `${this.first_name} ${this.last_name}`;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      tenant_id: this.tenant_id,
      user_id: this.user_id,
      role_id: this.role_id,
      permissions: this.permissions,
      is_active: this.is_active,
      granted_by: this.granted_by,
      granted_at: this.granted_at,
      expires_at: this.expires_at,
      revoked_by: this.revoked_by,
      revoked_at: this.revoked_at,
      revocation_reason: this.revocation_reason,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = AccessControl;
