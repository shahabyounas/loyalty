require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");

const { db } = require("../config/database");
const { logger } = require("../utils/logger");

console.log("🌱 Starting seeder...");

// Import models for seeding
console.log("📦 Loading models...");
const {
  Tenant,
  User,
  Store,
  CustomerLoyalty,
  Reward,
  StampCard,
} = require("../models");
console.log("✅ Models loaded successfully");

class SeederRunner {
  constructor() {
    this.seedersPath = path.join(__dirname, "seeders");
  }

  async getSeederFiles() {
    try {
      const files = await fs.readdir(this.seedersPath);
      return files.filter((file) => file.endsWith(".sql")).sort();
    } catch (error) {
      logger.error("Failed to read seeder files:", error);
      throw error;
    }
  }

  async executeSeeder(seederName) {
    try {
      const filePath = path.join(this.seedersPath, seederName);
      const sql = await fs.readFile(filePath, "utf8");

      await db.query(sql);
      logger.info(`Seeder executed: ${seederName}`);
    } catch (error) {
      logger.error(`Failed to execute seeder ${seederName}:`, error);
      throw error;
    }
  }

  async runSQLSeeders() {
    try {
      const seederFiles = await this.getSeederFiles();

      if (seederFiles.length === 0) {
        logger.info("No SQL seeders found");
        return;
      }

      logger.info(`Found ${seederFiles.length} SQL seeders`);

      for (const seeder of seederFiles) {
        await this.executeSeeder(seeder);
      }

      logger.info("All SQL seeders completed successfully");
    } catch (error) {
      logger.error("SQL seeding failed:", error);
      throw error;
    }
  }

  // Seed super admin
  async seedSuperAdmin() {
    try {
      console.log("👑 Starting super admin seeding...");

      // Check for existing super admin
      const existingSuperAdmin = await User.findByEmail(
        "superadmin@loyalty.com"
      );
      if (existingSuperAdmin) {
        console.log("ℹ️ Super admin already exists");
        return existingSuperAdmin;
      }

      // Note: In a real Supabase Auth setup, you would:
      // 1. Create the user in Supabase Auth first
      // 2. Get the auth_user_id from the response
      // 3. Create the super admin user with that auth_user_id

      // For seeding purposes, we'll create a placeholder
      // In production, this should be done through Supabase Auth API
      const superAdmin = await User.createSuperAdmin(
        "00000000-0000-0000-0000-000000000000", // Placeholder auth_user_id
        {
          email: "superadmin@loyalty.com",
          first_name: "System",
          last_name: "Administrator",
        }
      );

      console.log(`✅ Super admin created: ${superAdmin.email}`);
      return superAdmin;
    } catch (error) {
      console.error("❌ Super admin seeding failed:", error);
      throw error;
    }
  }

  // Seed sample tenants
  async seedTenants() {
    try {
      console.log("🏢 Starting tenant seeding...");
      const tenants = [];

      // Check for existing tenants first
      const existingTenants = await Tenant.findAll();
      if (existingTenants.length > 0) {
        console.log(
          `ℹ️ Found ${existingTenants.length} existing tenants, skipping tenant creation`
        );
        return existingTenants;
      }

      // Create sample vape shops
      const tenant1 = await Tenant.create({
        business_name: "Vape Shop London",
        business_email: "contact@vapeshop-london.com",
        business_phone: "+44 20 1234 5678",
        business_address: "123 Oxford Street, London, W1D 1BS",
        subscription_plan: "premium",
        max_stores: 3,
        max_customers: 5000,
      });
      tenants.push(tenant1);

      const tenant2 = await Tenant.create({
        business_name: "Cloud Nine Vapes",
        business_email: "info@cloudninevapes.com",
        business_phone: "+44 20 8765 4321",
        business_address: "456 High Street, Manchester, M1 1AA",
        subscription_plan: "basic",
        max_stores: 1,
        max_customers: 1000,
      });
      tenants.push(tenant2);

      const tenant3 = await Tenant.create({
        business_name: "Diamond Vape Co",
        business_email: "hello@diamondvape.co.uk",
        business_phone: "+44 20 5555 1234",
        business_address: "789 Queen Street, Birmingham, B1 1AA",
        subscription_plan: "premium",
        max_stores: 5,
        max_customers: 10000,
      });
      tenants.push(tenant3);

      console.log(`✅ Created ${tenants.length} sample tenants`);
      return tenants;
    } catch (error) {
      console.error("❌ Failed to seed tenants:", error);
      throw error;
    }
  }

  // Seed users for a tenant
  async seedUsersForTenant(tenant) {
    try {
      console.log(
        `👥 Starting user seeding for tenant: ${tenant.business_name}`
      );
      console.log(`🔍 Tenant ID: ${tenant.id}`);

      // Check for existing users for this tenant
      const existingUsers = await User.findAll({}, tenant.id);
      console.log(
        `🔍 Found ${existingUsers.length} existing users for tenant ${tenant.business_name}`
      );

      if (existingUsers.length > 0) {
        console.log(
          `ℹ️ Found ${existingUsers.length} existing users for tenant ${tenant.business_name}, skipping user creation`
        );
        return existingUsers;
      }

      const users = [];
      const passwordHash = await this.hashPassword("Password123!");

      // Create tenant admin
      const admin = await User.create({
        tenant_id: tenant.id,
        email: `admin@${tenant.business_name
          .toLowerCase()
          .replace(/\s+/g, "")}.com`,
        password_hash: passwordHash,
        first_name: "Admin",
        last_name: tenant.business_name.split(" ")[0],
        role: "tenant_admin",
        email_verified: true,
      });
      users.push(admin);

      // Create store managers
      const manager1 = await User.create({
        tenant_id: tenant.id,
        email: `manager1@${tenant.business_name
          .toLowerCase()
          .replace(/\s+/g, "")}.com`,
        password_hash: passwordHash,
        first_name: "John",
        last_name: "Manager",
        role: "store_manager",
        email_verified: true,
      });
      users.push(manager1);

      const manager2 = await User.create({
        tenant_id: tenant.id,
        email: `manager2@${tenant.business_name
          .toLowerCase()
          .replace(/\s+/g, "")}.com`,
        password_hash: passwordHash,
        first_name: "Sarah",
        last_name: "Manager",
        role: "store_manager",
        email_verified: true,
      });
      users.push(manager2);

      // Create staff members
      const staff1 = await User.create({
        tenant_id: tenant.id,
        email: `staff1@${tenant.business_name
          .toLowerCase()
          .replace(/\s+/g, "")}.com`,
        password_hash: passwordHash,
        first_name: "Mike",
        last_name: "Staff",
        role: "staff",
        email_verified: true,
      });
      users.push(staff1);

      const staff2 = await User.create({
        tenant_id: tenant.id,
        email: `staff2@${tenant.business_name
          .toLowerCase()
          .replace(/\s+/g, "")}.com`,
        password_hash: passwordHash,
        first_name: "Emma",
        last_name: "Staff",
        role: "staff",
        email_verified: true,
      });
      users.push(staff2);

      // Create sample customers
      const customer1 = await User.create({
        tenant_id: tenant.id,
        email: `customer1@${tenant.business_name
          .toLowerCase()
          .replace(/\s+/g, "")}.com`,
        password_hash: passwordHash,
        first_name: "Alex",
        last_name: "Customer",
        role: "customer",
        email_verified: true,
      });
      users.push(customer1);

      const customer2 = await User.create({
        tenant_id: tenant.id,
        email: `customer2@${tenant.business_name
          .toLowerCase()
          .replace(/\s+/g, "")}.com`,
        password_hash: passwordHash,
        first_name: "Lisa",
        last_name: "Customer",
        role: "customer",
        email_verified: true,
      });
      users.push(customer2);

      console.log(
        `✅ Created ${users.length} users for tenant: ${tenant.business_name}`
      );
      return users;
    } catch (error) {
      console.error(
        `❌ Failed to seed users for tenant ${tenant.business_name}:`,
        error
      );
      throw error;
    }
  }

  // Seed stores for a tenant
  async seedStoresForTenant(tenant) {
    try {
      console.log(
        `🏪 Starting store seeding for tenant: ${tenant.business_name}`
      );
      const stores = [];

      // Create stores based on tenant subscription
      const storeCount = tenant.max_stores;

      for (let i = 1; i <= storeCount; i++) {
        const store = await Store.create({
          tenant_id: tenant.id,
          name: `${tenant.business_name} - Store ${i}`,
          address: `${i}00 Main Street, ${tenant.business_name.split(" ")[0]}`,
          city: tenant.business_name.split(" ")[0],
          country: "UK",
          postal_code: `SW${i}A 1AA`,
          phone: `+44 20 ${i}234 5678`,
          email: `store${i}@${tenant.business_name
            .toLowerCase()
            .replace(/\s+/g, "")}.com`,
          // Note: store_manager_id will be set when users are created through Supabase Auth
          latitude: 51.5074 + i * 0.01,
          longitude: -0.1278 + i * 0.01,
          opening_hours: {
            monday: "09:00-18:00",
            tuesday: "09:00-18:00",
            wednesday: "09:00-18:00",
            thursday: "09:00-18:00",
            friday: "09:00-18:00",
            saturday: "10:00-16:00",
            sunday: "Closed",
          },
        });
        stores.push(store);
      }

      console.log(
        `✅ Created ${stores.length} stores for tenant: ${tenant.business_name}`
      );
      return stores;
    } catch (error) {
      console.error(
        `❌ Failed to seed stores for tenant ${tenant.business_name}:`,
        error
      );
      throw error;
    }
  }

  // Seed customer loyalty accounts
  async seedCustomerLoyalty(tenant, users) {
    try {
      console.log(
        `🎯 Starting loyalty seeding for tenant: ${tenant.business_name}`
      );
      const customers = users.filter((u) => u.role === "customer");
      const loyaltyAccounts = [];

      for (const customer of customers) {
        const loyalty = await CustomerLoyalty.create({
          tenant_id: tenant.id,
          user_id: customer.id,
          loyalty_number: await CustomerLoyalty.generateLoyaltyNumber(
            tenant.id
          ),
          current_points: Math.floor(Math.random() * 1000),
          current_level: Math.floor(Math.random() * 5) + 1,
          level_name: ["Bronze", "Silver", "Gold", "Platinum", "Diamond"][
            Math.floor(Math.random() * 5)
          ],
        });
        loyaltyAccounts.push(loyalty);
      }

      console.log(
        `✅ Created ${loyaltyAccounts.length} loyalty accounts for tenant: ${tenant.business_name}`
      );
      return loyaltyAccounts;
    } catch (error) {
      console.error(
        `❌ Failed to seed loyalty accounts for tenant ${tenant.business_name}:`,
        error
      );
      throw error;
    }
  }

  // Seed rewards
  async seedRewards(tenant) {
    try {
      console.log(
        `🎁 Starting reward seeding for tenant: ${tenant.business_name}`
      );
      const rewards = [];

      const rewardData = [
        {
          name: "10% Off Next Purchase",
          description: "Get 10% off your next purchase",
          points_cost: 500,
          discount_percentage: 10,
          reward_type: "discount",
        },
        {
          name: "£5 Off Purchase",
          description: "Get £5 off any purchase over £20",
          points_cost: 750,
          discount_amount: 5,
          reward_type: "discount",
        },
        {
          name: "Free Vape Juice",
          description: "Get a free bottle of premium vape juice",
          points_cost: 1000,
          reward_type: "free_item",
        },
        {
          name: "£10 Cashback",
          description: "Get £10 cashback on your account",
          points_cost: 1500,
          discount_amount: 10,
          reward_type: "cashback",
        },
        {
          name: "20% Off Premium Products",
          description: "Get 20% off all premium products",
          points_cost: 2000,
          discount_percentage: 20,
          reward_type: "discount",
        },
      ];

      for (const rewardInfo of rewardData) {
        const reward = await Reward.create({
          tenant_id: tenant.id,
          ...rewardInfo,
        });
        rewards.push(reward);
      }

      console.log(
        `✅ Created ${rewards.length} rewards for tenant: ${tenant.business_name}`
      );
      return rewards;
    } catch (error) {
      console.error(
        `❌ Failed to seed rewards for tenant ${tenant.business_name}:`,
        error
      );
      throw error;
    }
  }

  // Seed stamp cards
  async seedStampCards(tenant, loyaltyAccounts) {
    try {
      console.log(
        `🎫 Starting stamp card seeding for tenant: ${tenant.business_name}`
      );
      const stampCards = [];

      const stampCardData = [
        {
          card_name: "Buy 5 Get 1 Free",
          total_stamps: 5,
          reward_description: "Free vape juice of your choice",
        },
        {
          card_name: "Buy 10 Get 2 Free",
          total_stamps: 10,
          reward_description: "Two free vape juices",
        },
        {
          card_name: "Weekly Special",
          total_stamps: 3,
          reward_description: "20% off next purchase",
        },
      ];

      for (const loyalty of loyaltyAccounts) {
        // Create 1-2 stamp cards per customer
        const cardCount = Math.floor(Math.random() * 2) + 1;

        for (let i = 0; i < cardCount; i++) {
          const cardInfo = stampCardData[i % stampCardData.length];
          const stampCard = await StampCard.create({
            tenant_id: tenant.id,
            customer_loyalty_id: loyalty.id,
            ...cardInfo,
            current_stamps: Math.floor(Math.random() * cardInfo.total_stamps),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          });
          stampCards.push(stampCard);
        }
      }

      console.log(
        `✅ Created ${stampCards.length} stamp cards for tenant: ${tenant.business_name}`
      );
      return stampCards;
    } catch (error) {
      console.error(
        `❌ Failed to seed stamp cards for tenant ${tenant.business_name}:`,
        error
      );
      throw error;
    }
  }

  // Seed tenant configurations
  async seedTenantConfigurations(tenant) {
    try {
      console.log(
        `⚙️ Starting tenant configuration seeding for tenant: ${tenant.business_name}`
      );

      const configData = [
        {
          config_key: "points_per_pound",
          config_value: "1",
          config_type: "number",
          description: "Points earned per pound spent",
        },
        {
          config_key: "default_loyalty_level",
          config_value: "Bronze",
          config_type: "string",
          description: "Default loyalty level for new customers",
        },
        {
          config_key: "points_expiry_days",
          config_value: "365",
          config_type: "number",
          description: "Days before points expire",
        },
        {
          config_key: "stamp_card_expiry_days",
          config_value: "30",
          config_type: "number",
          description: "Days before stamp cards expire",
        },
        {
          config_key: "max_stamps_per_card",
          config_value: "10",
          config_type: "number",
          description: "Maximum stamps per stamp card",
        },
        {
          config_key: "welcome_points",
          config_value: "50",
          config_type: "number",
          description: "Points given to new customers",
        },
        {
          config_key: "referral_bonus",
          config_value: "100",
          config_type: "number",
          description: "Points given for successful referrals",
        },
      ];

      for (const data of configData) {
        await db.query(
          `INSERT INTO tenant_configurations (tenant_id, config_key, config_value, config_type, description)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (tenant_id, config_key) DO NOTHING`,
          [
            tenant.id,
            data.config_key,
            data.config_value,
            data.config_type,
            data.description,
          ]
        );
      }

      console.log(
        `✅ Created tenant configurations for tenant: ${tenant.business_name}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to seed tenant configurations for tenant ${tenant.business_name}:`,
        error
      );
      throw error;
    }
  }

  // Main seeding function
  async runFullSeeding() {
    try {
      console.log("🚀 Starting comprehensive seeding...");

      // 1. Seed super admin (for Supabase Auth integration)
      const superAdmin = await this.seedSuperAdmin();

      // 2. Seed tenants
      const tenants = await this.seedTenants();

      // 3. For each tenant, seed business data (no users - handled by Supabase Auth)
      for (const tenant of tenants) {
        console.log(`\n🏢 Seeding data for tenant: ${tenant.business_name}`);

        // Seed stores
        const stores = await this.seedStoresForTenant(tenant);

        // Seed rewards
        const rewards = await this.seedRewards(tenant);

        // Seed tenant configurations
        await this.seedTenantConfigurations(tenant);

        console.log(`✅ Completed seeding for tenant: ${tenant.business_name}`);
      }

      // 4. Run SQL seeders if any
      await this.runSQLSeeders();

      console.log("\n🎉 Comprehensive seeding completed successfully!");

      // Log summary
      console.log("\n=== SEEDING SUMMARY ===");
      console.log(`👑 Super Admin: ${superAdmin.email}`);
      console.log(`🏢 Tenants Created: ${tenants.length}`);
      tenants.forEach((tenant) => {
        console.log(
          `  - ${tenant.business_name} (${tenant.subscription_plan})`
        );
      });
      console.log("\n📝 NOTE: Users must be created through Supabase Auth");
      console.log(
        "   Customer loyalty and stamp cards will be created when users sign up"
      );
      console.log("======================");
    } catch (error) {
      console.error("❌ Comprehensive seeding failed:", error);
      throw error;
    }
  }

  async runSeeders() {
    try {
      // Run full seeding by default
      await this.runFullSeeding();
    } catch (error) {
      console.error("❌ Seeding failed:", error);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  console.log("🌱 Seeder CLI started");
  const seeder = new SeederRunner();

  seeder
    .runSeeders()
    .then(() => {
      console.log("✅ Seeding completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}

module.exports = SeederRunner;
