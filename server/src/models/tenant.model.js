const { db } = require("../config/database");
const { logger } = require("../utils/logger");

class Tenant {
  constructor(data) {
    this.id = data.id;
    this.business_name = data.business_name;
    this.business_email = data.business_email;
    this.business_phone = data.business_phone;
    this.business_address = data.business_address;
    this.business_logo_url = data.business_logo_url;
    this.subscription_plan = data.subscription_plan || 'basic';
    this.subscription_status = data.subscription_status || 'active';
    this.max_stores = data.max_stores || 1;
    this.max_customers = data.max_customers || 1000;
    this.is_active = data.is_active !== false;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(tenantData) {
    try {
      const query = `
        INSERT INTO tenants (
          business_name, business_email, business_phone, business_address,
          business_logo_url, subscription_plan, max_stores, max_customers
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const params = [
        tenantData.business_name,
        tenantData.business_email,
        tenantData.business_phone,
        tenantData.business_address,
        tenantData.business_logo_url,
        tenantData.subscription_plan || 'basic',
        tenantData.max_stores || 1,
        tenantData.max_customers || 1000
      ];

      const result = await db.getOne(query, params);
      return new Tenant(result);
    } catch (error) {
      logger.error("Error creating tenant:", error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = `
        SELECT * FROM tenants 
        WHERE id = $1 AND is_active = true
      `;
      const result = await db.getOne(query, [id]);
      return result ? new Tenant(result) : null;
    } catch (error) {
      logger.error("Error finding tenant by ID:", error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const query = `
        SELECT * FROM tenants 
        WHERE business_email = $1 AND is_active = true
      `;
      const result = await db.getOne(query, [email]);
      return result ? new Tenant(result) : null;
    } catch (error) {
      logger.error("Error finding tenant by email:", error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updateData).forEach((key) => {
        if (key !== "id" && key !== "created_at") {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        throw new Error("No valid fields to update");
      }

      values.push(id);
      const query = `
        UPDATE tenants 
        SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.getOne(query, values);
      return result ? new Tenant(result) : null;
    } catch (error) {
      logger.error("Error updating tenant:", error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = `
        UPDATE tenants 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `;
      const result = await db.getOne(query, [id]);
      return result !== null;
    } catch (error) {
      logger.error("Error deleting tenant:", error);
      throw error;
    }
  }

  static async findAll(options = {}) {
    try {
      let query = "SELECT * FROM tenants WHERE is_active = true";
      const values = [];
      let paramCount = 1;

      if (options.subscription_status) {
        query += ` AND subscription_status = $${paramCount}`;
        values.push(options.subscription_status);
        paramCount++;
      }

      if (options.subscription_plan) {
        query += ` AND subscription_plan = $${paramCount}`;
        values.push(options.subscription_plan);
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
      return results.map((row) => new Tenant(row));
    } catch (error) {
      logger.error("Error finding all tenants:", error);
      throw error;
    }
  }

  static async getTenantStats(tenantId) {
    try {
      const query = `
        SELECT 
          t.*,
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT s.id) as total_stores,
          COUNT(DISTINCT cl.id) as total_loyalty_accounts,
          COUNT(DISTINCT CASE WHEN s.is_active = true THEN s.id END) as active_stores,
          COUNT(DISTINCT CASE WHEN u.is_active = true THEN u.id END) as active_users
        FROM tenants t
        LEFT JOIN users u ON u.tenant_id = t.id
        LEFT JOIN stores s ON s.tenant_id = t.id
        LEFT JOIN customer_loyalty cl ON cl.tenant_id = t.id
        WHERE t.id = $1
        GROUP BY t.id
      `;
      
      const result = await db.getOne(query, [tenantId]);
      return result;
    } catch (error) {
      logger.error("Error getting tenant stats:", error);
      throw error;
    }
  }

  static async updateSubscription(tenantId, subscriptionData) {
    try {
      const query = `
        UPDATE tenants 
        SET 
          subscription_plan = $1,
          subscription_status = $2,
          max_stores = $3,
          max_customers = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `;
      
      const params = [
        subscriptionData.plan,
        subscriptionData.status,
        subscriptionData.max_stores,
        subscriptionData.max_customers,
        tenantId
      ];

      const result = await db.getOne(query, params);
      return result ? new Tenant(result) : null;
    } catch (error) {
      logger.error("Error updating tenant subscription:", error);
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      business_name: this.business_name,
      business_email: this.business_email,
      business_phone: this.business_phone,
      business_address: this.business_address,
      business_logo_url: this.business_logo_url,
      subscription_plan: this.subscription_plan,
      subscription_status: this.subscription_status,
      max_stores: this.max_stores,
      max_customers: this.max_customers,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  async save() {
    if (this.id) {
      return await Tenant.update(this.id, this);
    } else {
      const newTenant = await Tenant.create(this);
      this.id = newTenant.id;
      return newTenant;
    }
  }
}

module.exports = Tenant; 