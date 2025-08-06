const { db } = require("../config/database");
const { logger } = require("../utils/logger");

class User {
  constructor(data) {
    this.id = data.id;
    this.auth_user_id = data.auth_user_id;
    this.tenant_id = data.tenant_id;
    this.email = data.email;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.phone = data.phone;
    this.avatar_url = data.avatar_url;
    this.role = data.role;
    this.is_active = data.is_active !== false;
    this.email_verified = data.email_verified || false;
    this.phone_verified = data.phone_verified || false;
    this.last_login = data.last_login;
    this.permissions = data.permissions || {};
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(userData) {
    try {
      const query = `
        INSERT INTO users (
          auth_user_id, tenant_id, email, first_name, last_name, 
          phone, avatar_url, role, is_active, email_verified, phone_verified, permissions
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      const params = [
        userData.auth_user_id,
        userData.tenant_id || null,
        userData.email,
        userData.first_name,
        userData.last_name,
        userData.phone || null,
        userData.avatar_url || null,
        userData.role || "customer",
        userData.is_active !== false,
        userData.email_verified || false,
        userData.phone_verified || false,
        JSON.stringify(userData.permissions || {}),
      ];

      const result = await db.getOne(query, params);
      return new User(result);
    } catch (error) {
      logger.error("Error creating user:", error);
      throw error;
    }
  }

  static async findByAuthUserId(authUserId) {
    try {
      const query = `
        SELECT * FROM users 
        WHERE auth_user_id = $1 AND is_active = true
      `;
      const result = await db.getOne(query, [authUserId]);
      return result ? new User(result) : null;
    } catch (error) {
      logger.error("Error finding user by auth user ID:", error);
      throw error;
    }
  }

  static async findById(id, tenantId = null) {
    try {
      let query = `
        SELECT * FROM users 
        WHERE id = $1 AND is_active = true
      `;
      const params = [id];

      if (tenantId) {
        query += ` AND tenant_id = $2`;
        params.push(tenantId);
      }

      const result = await db.getOne(query, params);
      return result ? new User(result) : null;
    } catch (error) {
      logger.error("Error finding user by ID:", error);
      throw error;
    }
  }

  static async findByEmail(email, tenantId = null) {
    try {
      let query = `
        SELECT * FROM users 
        WHERE email = $1 AND is_active = true
      `;
      const params = [email];

      if (tenantId) {
        query += ` AND tenant_id = $2`;
        params.push(tenantId);
      }

      const result = await db.getOne(query, params);
      return result ? new User(result) : null;
    } catch (error) {
      logger.error("Error finding user by email:", error);
      throw error;
    }
  }

  static async update(id, updateData, tenantId = null) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updateData).forEach((key) => {
        if (key !== "id" && key !== "created_at" && key !== "auth_user_id") {
          if (key === "permissions") {
            fields.push(`${key} = $${paramCount}`);
            values.push(JSON.stringify(updateData[key]));
          } else {
            fields.push(`${key} = $${paramCount}`);
            values.push(updateData[key]);
          }
          paramCount++;
        }
      });

      if (fields.length === 0) {
        throw new Error("No valid fields to update");
      }

      values.push(id);
      let query = `
        UPDATE users 
        SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
      `;

      if (tenantId) {
        query += ` AND tenant_id = $${paramCount + 1}`;
        values.push(tenantId);
      }

      query += ` RETURNING *`;

      const result = await db.getOne(query, values);
      return result ? new User(result) : null;
    } catch (error) {
      logger.error("Error updating user:", error);
      throw error;
    }
  }

  static async delete(id, tenantId = null) {
    try {
      let query = `
        UPDATE users 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      const params = [id];

      if (tenantId) {
        query += ` AND tenant_id = $2`;
        params.push(tenantId);
      }

      query += ` RETURNING *`;

      const result = await db.getOne(query, params);
      return result ? new User(result) : null;
    } catch (error) {
      logger.error("Error deleting user:", error);
      throw error;
    }
  }

  static async updateLastLogin(id, tenantId = null) {
    try {
      let query = `
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      const params = [id];

      if (tenantId) {
        query += ` AND tenant_id = $2`;
        params.push(tenantId);
      }

      query += ` RETURNING *`;

      const result = await db.getOne(query, params);
      return result ? new User(result) : null;
    } catch (error) {
      logger.error("Error updating last login:", error);
      throw error;
    }
  }

  static async verifyEmail(id, tenantId = null) {
    try {
      let query = `
        UPDATE users 
        SET email_verified = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      const params = [id];

      if (tenantId) {
        query += ` AND tenant_id = $2`;
        params.push(tenantId);
      }

      query += ` RETURNING *`;

      const result = await db.getOne(query, params);
      return result ? new User(result) : null;
    } catch (error) {
      logger.error("Error verifying email:", error);
      throw error;
    }
  }

  static async findAll(options = {}, tenantId = null) {
    try {
      let query = "SELECT * FROM users WHERE is_active = true";
      const values = [];
      let paramCount = 1;

      if (tenantId) {
        query += ` AND tenant_id = $${paramCount}`;
        values.push(tenantId);
        paramCount++;
      }

      if (options.role) {
        query += ` AND role = $${paramCount}`;
        values.push(options.role);
        paramCount++;
      }

      if (options.emailVerified !== undefined) {
        query += ` AND email_verified = $${paramCount}`;
        values.push(options.emailVerified);
        paramCount++;
      }

      if (options.search) {
        query += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        values.push(`%${options.search}%`);
        paramCount++;
      }

      query += " ORDER BY created_at DESC";

      if (options.limit) {
        query += ` LIMIT $${paramCount}`;
        values.push(options.limit);
        paramCount++;
      }

      if (options.offset) {
        query += ` OFFSET $${paramCount}`;
        values.push(options.offset);
      }

      const results = await db.getMany(query, values);
      return results.map((row) => new User(row));
    } catch (error) {
      logger.error("Error finding all users:", error);
      throw error;
    }
  }

  static async count(options = {}, tenantId = null) {
    try {
      let query = "SELECT COUNT(*) as count FROM users WHERE is_active = true";
      const values = [];
      let paramCount = 1;

      if (tenantId) {
        query += ` AND tenant_id = $${paramCount}`;
        values.push(tenantId);
        paramCount++;
      }

      if (options.role) {
        query += ` AND role = $${paramCount}`;
        values.push(options.role);
        paramCount++;
      }

      if (options.emailVerified !== undefined) {
        query += ` AND email_verified = $${paramCount}`;
        values.push(options.emailVerified);
      }

      const result = await db.getOne(query, values);
      return parseInt(result.count);
    } catch (error) {
      logger.error("Error counting users:", error);
      throw error;
    }
  }

  static async getUsersByRole(role, tenantId) {
    try {
      const query = `
        SELECT * FROM users 
        WHERE role = $1 AND tenant_id = $2 AND is_active = true
        ORDER BY first_name, last_name
      `;

      const results = await db.getMany(query, [role, tenantId]);
      return results.map((row) => new User(row));
    } catch (error) {
      logger.error("Error getting users by role:", error);
      throw error;
    }
  }

  static async getStoreStaff(storeId, tenantId) {
    try {
      const query = `
        SELECT u.* FROM users u
        INNER JOIN store_staff ss ON u.id = ss.user_id
        WHERE ss.store_id = $1 AND ss.tenant_id = $2 AND ss.is_active = true
        ORDER BY u.first_name, u.last_name
      `;

      const results = await db.getMany(query, [storeId, tenantId]);
      return results.map((row) => new User(row));
    } catch (error) {
      logger.error("Error getting store staff:", error);
      throw error;
    }
  }

  static async assignToStore(userId, storeId, role = "staff", tenantId) {
    try {
      const query = `
        INSERT INTO store_staff (tenant_id, store_id, user_id, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (store_id, user_id) 
        DO UPDATE SET role = $4, updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const result = await db.getOne(query, [tenantId, storeId, userId, role]);
      return result;
    } catch (error) {
      logger.error("Error assigning user to store:", error);
      throw error;
    }
  }

  static async removeFromStore(userId, storeId, tenantId) {
    try {
      const query = `
        UPDATE store_staff 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND store_id = $2 AND tenant_id = $3
        RETURNING *
      `;

      const result = await db.getOne(query, [userId, storeId, tenantId]);
      return result;
    } catch (error) {
      logger.error("Error removing user from store:", error);
      throw error;
    }
  }

  static async createSuperAdmin(authUserId, userData) {
    try {
      const superAdmin = await User.create({
        ...userData,
        auth_user_id: authUserId,
        role: "super_admin",
        permissions: ["*"],
        email_verified: true,
      });

      return superAdmin;
    } catch (error) {
      logger.error("Error creating super admin:", error);
      throw error;
    }
  }

  static async createTenantAdmin(authUserId, userData, tenantId) {
    try {
      const tenantAdmin = await User.create({
        ...userData,
        auth_user_id: authUserId,
        tenant_id: tenantId,
        role: "tenant_admin",
        permissions: [
          "tenant_manage",
          "user_manage",
          "store_manage",
          "loyalty_manage",
          "reward_manage",
          "report_view",
        ],
        email_verified: true,
      });

      return tenantAdmin;
    } catch (error) {
      logger.error("Error creating tenant admin:", error);
      throw error;
    }
  }

  static async createCustomer(authUserId, userData, tenantId) {
    try {
      const customer = await User.create({
        ...userData,
        auth_user_id: authUserId,
        tenant_id: tenantId,
        role: "customer",
        permissions: ["profile_view", "loyalty_view", "reward_redeem"],
        email_verified: true,
      });

      return customer;
    } catch (error) {
      logger.error("Error creating customer:", error);
      throw error;
    }
  }

  hasPermission(permission) {
    // Define role-based permissions
    const rolePermissions = {
      super_admin: ["*"],
      tenant_admin: [
        "tenant_manage",
        "user_manage",
        "store_manage",
        "loyalty_manage",
        "reward_manage",
        "report_view",
        "stamp_scan",
        "purchase_process",
      ],
      store_manager: [
        "store_manage",
        "staff_manage",
        "stamp_scan",
        "purchase_process",
        "report_view",
        "customer_view",
      ],
      staff: ["stamp_scan", "purchase_process", "customer_view"],
      customer: ["profile_view", "loyalty_view", "reward_redeem"],
    };

    const permissions = rolePermissions[this.role] || [];
    return permissions.includes("*") || permissions.includes(permission);
  }

  canScanStamps() {
    return this.hasPermission("stamp_scan");
  }

  canManageUsers() {
    return this.hasPermission("user_manage");
  }

  canManageTenants() {
    return this.role === "super_admin";
  }

  isSuperAdmin() {
    return this.role === "super_admin";
  }

  isTenantAdmin() {
    return this.role === "tenant_admin";
  }

  isCustomer() {
    return this.role === "customer";
  }

  toJSON() {
    return {
      id: this.id,
      auth_user_id: this.auth_user_id,
      tenant_id: this.tenant_id,
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      phone: this.phone,
      avatar_url: this.avatar_url,
      role: this.role,
      is_active: this.is_active,
      email_verified: this.email_verified,
      phone_verified: this.phone_verified,
      last_login: this.last_login,
      permissions: this.permissions,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  async save() {
    if (this.id) {
      const updated = await User.update(this.id, this.toJSON(), this.tenant_id);
      Object.assign(this, updated);
    } else {
      const created = await User.create(this.toJSON());
      Object.assign(this, created);
    }
    return this;
  }
}

module.exports = User;
