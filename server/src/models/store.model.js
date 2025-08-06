const { db } = require("../config/database");
const { logger } = require("../utils/logger");

class Store {
  constructor(data) {
    this.id = data.id;
    this.tenant_id = data.tenant_id;
    this.name = data.name;
    this.address = data.address;
    this.city = data.city;
    this.country = data.country || "UK";
    this.postal_code = data.postal_code;
    this.phone = data.phone;
    this.email = data.email;
    this.store_manager_id = data.store_manager_id;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.opening_hours = data.opening_hours || {};
    this.is_active = data.is_active !== false;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async create(storeData) {
    try {
      const query = `
        INSERT INTO stores (
          tenant_id, name, address, city, country, postal_code,
          phone, email, store_manager_id, latitude, longitude, opening_hours
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      const params = [
        storeData.tenant_id,
        storeData.name,
        storeData.address,
        storeData.city,
        storeData.country || "UK",
        storeData.postal_code,
        storeData.phone,
        storeData.email,
        storeData.store_manager_id,
        storeData.latitude,
        storeData.longitude,
        JSON.stringify(storeData.opening_hours || {}),
      ];

      const result = await db.getOne(query, params);
      return new Store(result);
    } catch (error) {
      logger.error("Error creating store:", error);
      throw error;
    }
  }

  static async findById(id, tenantId = null) {
    try {
      let query = `
        SELECT s.*, u.first_name as manager_first_name, u.last_name as manager_last_name
        FROM stores s
        LEFT JOIN users u ON s.store_manager_id = u.id
        WHERE s.id = $1 AND s.is_active = true
      `;
      const params = [id];

      if (tenantId) {
        query += ` AND s.tenant_id = $2`;
        params.push(tenantId);
      }

      const result = await db.getOne(query, params);
      return result ? new Store(result) : null;
    } catch (error) {
      logger.error("Error finding store by ID:", error);
      throw error;
    }
  }

  static async update(id, updateData, tenantId = null) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updateData).forEach((key) => {
        if (key !== "id" && key !== "created_at" && key !== "tenant_id") {
          if (key === "opening_hours") {
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
        UPDATE stores 
        SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
      `;
      paramCount++;

      if (tenantId) {
        query += ` AND tenant_id = $${paramCount}`;
        values.push(tenantId);
      }

      query += " RETURNING *";

      const result = await db.getOne(query, values);
      return result ? new Store(result) : null;
    } catch (error) {
      logger.error("Error updating store:", error);
      throw error;
    }
  }

  static async delete(id, tenantId = null) {
    try {
      let query = `
        UPDATE stores 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      const params = [id];

      if (tenantId) {
        query += ` AND tenant_id = $2`;
        params.push(tenantId);
      }

      query += " RETURNING *";

      const result = await db.getOne(query, params);
      return result ? new Store(result) : null;
    } catch (error) {
      logger.error("Error deleting store:", error);
      throw error;
    }
  }

  static async findAll(options = {}, tenantId = null) {
    try {
      let query = `
        SELECT s.*, u.first_name as manager_first_name, u.last_name as manager_last_name
        FROM stores s
        LEFT JOIN users u ON s.store_manager_id = u.id
        WHERE s.is_active = true
      `;
      const params = [];
      let paramCount = 1;

      if (tenantId) {
        query += ` AND s.tenant_id = $${paramCount}`;
        params.push(tenantId);
        paramCount++;
      }

      if (options.city) {
        query += ` AND s.city ILIKE $${paramCount}`;
        params.push(`%${options.city}%`);
        paramCount++;
      }

      if (options.search) {
        query += ` AND (s.name ILIKE $${paramCount} OR s.address ILIKE $${paramCount})`;
        params.push(`%${options.search}%`);
        paramCount++;
      }

      if (options.has_manager !== undefined) {
        if (options.has_manager) {
          query += ` AND s.store_manager_id IS NOT NULL`;
        } else {
          query += ` AND s.store_manager_id IS NULL`;
        }
      }

      query += " ORDER BY s.created_at DESC";

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
      return results.map((row) => new Store(row));
    } catch (error) {
      logger.error("Error finding stores:", error);
      throw error;
    }
  }

  static async getStoreStats(storeId, tenantId) {
    try {
      const query = `
        SELECT 
          s.id,
          s.name,
          COUNT(DISTINCT ss.user_id) as total_staff,
          COUNT(DISTINCT p.id) as total_purchases,
          COALESCE(SUM(p.final_amount), 0) as total_revenue,
          COUNT(DISTINCT CASE WHEN p.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN p.id END) as purchases_last_30_days
        FROM stores s
        LEFT JOIN store_staff ss ON s.id = ss.store_id AND ss.is_active = true
        LEFT JOIN purchases p ON s.id = p.store_id
        WHERE s.id = $1 AND s.is_active = true
        ${tenantId ? "AND s.tenant_id = $2" : ""}
        GROUP BY s.id, s.name
      `;

      const params = tenantId ? [storeId, tenantId] : [storeId];
      const result = await db.getOne(query, params);
      return result;
    } catch (error) {
      logger.error("Error getting store stats:", error);
      throw error;
    }
  }

  static async getNearbyStores(latitude, longitude, radius = 10, tenantId) {
    try {
      const query = `
        SELECT 
          s.*,
          u.first_name as manager_first_name,
          u.last_name as manager_last_name,
          (
            6371 * acos(
              cos(radians($1)) * cos(radians(s.latitude)) *
              cos(radians(s.longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(s.latitude))
            )
          ) AS distance
        FROM stores s
        LEFT JOIN users u ON s.store_manager_id = u.id
        WHERE s.is_active = true
        ${tenantId ? "AND s.tenant_id = $4" : ""}
        HAVING (
          6371 * acos(
            cos(radians($1)) * cos(radians(s.latitude)) *
            cos(radians(s.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(s.latitude))
          )
        ) <= $3
        ORDER BY distance
      `;

      const params = tenantId
        ? [latitude, longitude, radius, tenantId]
        : [latitude, longitude, radius];
      const results = await db.getMany(query, params);
      return results.map((row) => new Store(row));
    } catch (error) {
      logger.error("Error finding nearby stores:", error);
      throw error;
    }
  }

  static async assignManager(storeId, managerId, tenantId) {
    try {
      const query = `
        UPDATE stores 
        SET store_manager_id = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND tenant_id = $3
        RETURNING *
      `;

      const result = await db.getOne(query, [storeId, managerId, tenantId]);
      return result ? new Store(result) : null;
    } catch (error) {
      logger.error("Error assigning store manager:", error);
      throw error;
    }
  }

  static async getStoreStaff(storeId, tenantId) {
    try {
      const query = `
        SELECT ss.*, u.first_name, u.last_name, u.email, u.role
        FROM store_staff ss
        JOIN users u ON ss.user_id = u.id
        WHERE ss.store_id = $1 AND ss.tenant_id = $2 AND ss.is_active = true
        ORDER BY ss.role, u.first_name
      `;

      const results = await db.getMany(query, [storeId, tenantId]);
      return results;
    } catch (error) {
      logger.error("Error getting store staff:", error);
      throw error;
    }
  }

  static async count(options = {}, tenantId = null) {
    try {
      let query = "SELECT COUNT(*) as count FROM stores WHERE is_active = true";
      const params = [];
      let paramCount = 1;

      if (tenantId) {
        query += ` AND tenant_id = $${paramCount}`;
        params.push(tenantId);
        paramCount++;
      }

      if (options.city) {
        query += ` AND city ILIKE $${paramCount}`;
        params.push(`%${options.city}%`);
        paramCount++;
      }

      if (options.has_manager !== undefined) {
        if (options.has_manager) {
          query += ` AND store_manager_id IS NOT NULL`;
        } else {
          query += ` AND store_manager_id IS NULL`;
        }
      }

      const result = await db.getOne(query, params);
      return parseInt(result.count);
    } catch (error) {
      logger.error("Error counting stores:", error);
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      tenant_id: this.tenant_id,
      name: this.name,
      address: this.address,
      city: this.city,
      country: this.country,
      postal_code: this.postal_code,
      phone: this.phone,
      email: this.email,
      store_manager_id: this.store_manager_id,
      latitude: this.latitude,
      longitude: this.longitude,
      opening_hours: this.opening_hours,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  async save() {
    if (this.id) {
      return await Store.update(this.id, this.toJSON(), this.tenant_id);
    } else {
      return await Store.create(this.toJSON());
    }
  }
}

module.exports = Store;
