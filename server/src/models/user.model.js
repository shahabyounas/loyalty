const { db } = require("../config/database");
const { logger } = require("../utils/logger");

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.role = data.role || "user";
    this.is_active = data.is_active !== false;
    this.email_verified = data.email_verified || false;
    this.last_login = data.last_login;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async findByEmail(email) {
    try {
      const query = `
        SELECT * FROM users 
        WHERE email = $1 AND is_active = true
      `;
      const result = await db.getOne(query, [email]);
      return result ? new User(result) : null;
    } catch (error) {
      logger.error("Error finding user by email:", error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = `
        SELECT * FROM users 
        WHERE id = $1 AND is_active = true
      `;
      const result = await db.getOne(query, [id]);
      return result ? new User(result) : null;
    } catch (error) {
      logger.error("Error finding user by ID:", error);
      throw error;
    }
  }

  static async create(userData) {
    try {
      const query = `
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const params = [
        userData.email,
        userData.password_hash,
        userData.first_name,
        userData.last_name,
        userData.role || "user",
      ];

      const result = await db.getOne(query, params);
      return new User(result);
    } catch (error) {
      logger.error("Error creating user:", error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      // Build dynamic update query
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
        UPDATE users 
        SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.getOne(query, values);
      return result ? new User(result) : null;
    } catch (error) {
      logger.error("Error updating user:", error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = `
        UPDATE users 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `;
      const result = await db.getOne(query, [id]);
      return result !== null;
    } catch (error) {
      logger.error("Error deleting user:", error);
      throw error;
    }
  }

  static async updateLastLogin(id) {
    try {
      const query = `
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const result = await db.getOne(query, [id]);
      return result ? new User(result) : null;
    } catch (error) {
      logger.error("Error updating last login:", error);
      throw error;
    }
  }

  static async verifyEmail(id) {
    try {
      const query = `
        UPDATE users 
        SET email_verified = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const result = await db.getOne(query, [id]);
      return result ? new User(result) : null;
    } catch (error) {
      logger.error("Error verifying email:", error);
      throw error;
    }
  }

  static async findAll(options = {}) {
    try {
      let query = "SELECT * FROM users WHERE is_active = true";
      const values = [];
      let paramCount = 1;

      // Add role filter
      if (options.role) {
        query += ` AND role = $${paramCount}`;
        values.push(options.role);
        paramCount++;
      }

      // Add email verification filter
      if (options.emailVerified !== undefined) {
        query += ` AND email_verified = $${paramCount}`;
        values.push(options.emailVerified);
        paramCount++;
      }

      // Add ordering
      query += " ORDER BY created_at DESC";

      // Add pagination
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

  static async count(options = {}) {
    try {
      let query = "SELECT COUNT(*) as count FROM users WHERE is_active = true";
      const values = [];
      let paramCount = 1;

      // Add role filter
      if (options.role) {
        query += ` AND role = $${paramCount}`;
        values.push(options.role);
        paramCount++;
      }

      // Add email verification filter
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

  toJSON() {
    const { password_hash, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  // Instance methods
  async save() {
    if (this.id) {
      return await User.update(this.id, this);
    } else {
      const newUser = await User.create(this);
      this.id = newUser.id;
      return newUser;
    }
  }
}

module.exports = User;
