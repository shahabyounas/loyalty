const { db } = require("../config/database");
const { logger } = require("../utils/logger");

class Store {
  constructor(data) {
    this.id = data.id;
    this.tenant_id = data.tenant_id;
    this.name = data.name;
    this.address = data.address;
    this.city = data.city;
    this.state = data.state;
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
          tenant_id, name, address, city, state, country, postal_code,
          phone, email, store_manager_id, latitude, longitude, opening_hours
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      const params = [
        storeData.tenant_id,
        storeData.name,
        storeData.address,
        storeData.city,
        storeData.state,
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

      if (tenantId) {
        query += ` AND tenant_id = $${paramCount + 1}`;
        values.push(tenantId);
      }

      query += ` RETURNING *`;

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

      query += ` RETURNING id`;

      const result = await db.getOne(query, params);
      return result !== null;
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
      const values = [];
      let paramCount = 1;

      if (tenantId) {
        query += ` AND s.tenant_id = $${paramCount}`;
        values.push(tenantId);
        paramCount++;
      }

      if (options.city) {
        query += ` AND s.city ILIKE $${paramCount}`;
        values.push(`%${options.city}%`);
        paramCount++;
      }

      if (options.search) {
        query += ` AND (s.name ILIKE $${paramCount} OR s.address ILIKE $${paramCount})`;
        values.push(`%${options.search}%`);
        paramCount++;
      }

      if (options.activeOnly !== undefined) {
        query += ` AND s.is_active = $${paramCount}`;
        values.push(options.activeOnly);
        paramCount++;
      }

      query += " ORDER BY s.name";

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
      return results.map((row) => new Store(row));
    } catch (error) {
      logger.error("Error finding all stores:", error);
      throw error;
    }
  }

  static async getStoreStats(storeId, tenantId) {
    try {
      const query = `
        SELECT 
          s.*,
          COUNT(DISTINCT ss.user_id) as total_staff,
          COUNT(DISTINCT p.id) as total_purchases,
          COUNT(DISTINCT st.id) as total_stamp_transactions,
          SUM(p.total_amount) as total_revenue
        FROM stores s
        LEFT JOIN store_staff ss ON s.id = ss.store_id AND ss.is_active = true
        LEFT JOIN purchases p ON s.id = p.store_id
        LEFT JOIN stamp_transactions st ON s.id = st.store_id
        WHERE s.id = $1 AND s.tenant_id = $2
        GROUP BY s.id
      `;

      const result = await db.getOne(query, [storeId, tenantId]);
      return result;
    } catch (error) {
      logger.error("Error getting store stats:", error);
      throw error;
    }
  }

  static async getNearbyStores(latitude, longitude, radius = 10, tenantId) {
    try {
      const query = `
        SELECT s.*, 
               (6371 * acos(cos(radians($1)) * cos(radians(s.latitude)) * 
                cos(radians(s.longitude) - radians($2)) + 
                sin(radians($1)) * sin(radians(s.latitude)))) AS distance
        FROM stores s
        WHERE s.tenant_id = $3 
          AND s.is_active = true
          AND s.latitude IS NOT NULL 
          AND s.longitude IS NOT NULL
        HAVING (6371 * acos(cos(radians($1)) * cos(radians(s.latitude)) * 
                cos(radians(s.longitude) - radians($2)) + 
                sin(radians($1)) * sin(radians(s.latitude)))) <= $4
        ORDER BY distance
      `;

      const results = await db.getMany(query, [
        latitude,
        longitude,
        tenantId,
        radius,
      ]);
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
        SET store_manager_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND tenant_id = $3
        RETURNING *
      `;

      const result = await db.getOne(query, [managerId, storeId, tenantId]);
      return result ? new Store(result) : null;
    } catch (error) {
      logger.error("Error assigning store manager:", error);
      throw error;
    }
  }

  static async getStoreStaff(storeId, tenantId) {
    try {
      const query = `
        SELECT u.*, ss.role as store_role, ss.assigned_at
        FROM users u
        INNER JOIN store_staff ss ON u.id = ss.user_id
        WHERE ss.store_id = $1 AND u.tenant_id = $2 AND u.is_active = true
        ORDER BY u.first_name, u.last_name
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
      const values = [];
      let paramCount = 1;

      if (tenantId) {
        query += ` AND tenant_id = $${paramCount}`;
        values.push(tenantId);
        paramCount++;
      }

      if (options.city) {
        query += ` AND city ILIKE $${paramCount}`;
        values.push(`%${options.city}%`);
        paramCount++;
      }

      const result = await db.getOne(query, values);
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
      state: this.state,
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
      return await Store.update(this.id, this, this.tenant_id);
    } else {
      const newStore = await Store.create(this);
      this.id = newStore.id;
      return newStore;
    }
  }
}

module.exports = Store;
