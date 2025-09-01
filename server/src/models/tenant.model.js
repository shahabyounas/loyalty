const { db } = require("../config/database");
const { logger } = require("../utils/logger");

class Tenant {
  constructor(data) {
    this.id = data.id;
    this.business_name = data.business_name;
    this.business_type = data.business_type;
    this.domain = data.domain;
    this.subscription_plan = data.subscription_plan || "basic";
    this.max_stores = data.max_stores || 10;
    this.max_users = data.max_users || 1000;
    this.contact_email = data.contact_email;
    this.contact_phone = data.contact_phone;
    this.address = data.address;
    this.city = data.city;
    this.country = data.country || "UK";
    this.postal_code = data.postal_code;
    this.tax_id = data.tax_id;
    this.is_active = data.is_active !== false;
    this.trial_ends_at = data.trial_ends_at;
    this.subscription_ends_at = data.subscription_ends_at;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(tenantData) {
    try {
      const query = `
        INSERT INTO tenants (
          business_name, business_type, domain, subscription_plan, max_stores, max_users,
          contact_email, contact_phone, address, city, country, postal_code, tax_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      const params = [
        tenantData.business_name,
        tenantData.business_type,
        tenantData.domain,
        tenantData.subscription_plan || "basic",
        tenantData.max_stores || 1,
        tenantData.max_users || 10,
        tenantData.contact_email,
        tenantData.contact_phone,
        tenantData.address,
        tenantData.city,
        tenantData.country || "UK",
        tenantData.postal_code,
        tenantData.tax_id,
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
        WHERE contact_email = $1 AND is_active = true
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
        RETURNING *
      `;
      const result = await db.getOne(query, [id]);
      return result ? new Tenant(result) : null;
    } catch (error) {
      logger.error("Error deleting tenant:", error);
      throw error;
    }
  }

  static async findAll(options = {}) {
    try {
      let query = "SELECT * FROM tenants WHERE is_active = true";
      const params = [];
      let paramCount = 1;

      if (options.subscription_plan) {
        query += ` AND subscription_plan = $${paramCount}`;
        params.push(options.subscription_plan);
        paramCount++;
      }

      if (options.city) {
        query += ` AND city ILIKE $${paramCount}`;
        params.push(`%${options.city}%`);
        paramCount++;
      }

      if (options.search) {
        query += ` AND (business_name ILIKE $${paramCount} OR contact_email ILIKE $${paramCount})`;
        params.push(`%${options.search}%`);
        paramCount++;
      }

      query += " ORDER BY created_at DESC";

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
      return results.map((row) => new Tenant(row));
    } catch (error) {
      logger.error("Error finding tenants:", error);
      throw error;
    }
  }

  static async getTenantStats(tenantId) {
    try {
      const query = `
        SELECT 
          t.id,
          t.business_name,
          t.subscription_plan,
          COUNT(DISTINCT s.id) as total_stores,
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT cl.id) as total_customers,
          COUNT(DISTINCT p.id) as total_purchases,
          COALESCE(SUM(p.final_amount), 0) as total_revenue
        FROM tenants t
        LEFT JOIN stores s ON t.id = s.tenant_id AND s.is_active = true
        LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = true
        LEFT JOIN customer_loyalty cl ON t.id = cl.tenant_id AND cl.is_active = true
        LEFT JOIN purchases p ON t.id = p.tenant_id
        WHERE t.id = $1 AND t.is_active = true
        GROUP BY t.id, t.business_name, t.subscription_plan
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
          subscription_plan = $2,
          max_stores = $3,
          max_users = $4,
          subscription_ends_at = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const params = [
        tenantId,
        subscriptionData.subscription_plan,
        subscriptionData.max_stores,
        subscriptionData.max_users,
        subscriptionData.subscription_ends_at,
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
      business_type: this.business_type,
      subscription_plan: this.subscription_plan,
      max_stores: this.max_stores,
      max_users: this.max_users,
      contact_email: this.contact_email,
      contact_phone: this.contact_phone,
      address: this.address,
      city: this.city,
      country: this.country,
      postal_code: this.postal_code,
      tax_id: this.tax_id,
      is_active: this.is_active,
      trial_ends_at: this.trial_ends_at,
      subscription_ends_at: this.subscription_ends_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  async save() {
    if (this.id) {
      return await Tenant.update(this.id, this.toJSON());
    } else {
      return await Tenant.create(this.toJSON());
    }
  }
}

module.exports = Tenant;
