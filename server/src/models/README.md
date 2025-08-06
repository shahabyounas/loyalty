# 🏗️ **Multi-Tenant Loyalty System Database Models**

This directory contains comprehensive database models for a multi-tenant loyalty system that supports businesses, customers, stores, rewards, stamps, and employee tracking.

## 📊 **Database Architecture Overview**

### **Multi-Tenancy Strategy**
- **Row-Level Security (RLS)**: Complete data isolation between tenants
- **Tenant Context**: Automatic tenant filtering for all operations
- **Scalable Design**: Supports unlimited businesses with individual data separation

### **Core Entities**
1. **Tenants** - Individual businesses
2. **Users** - Multi-role users (customers, staff, managers, admins)
3. **Stores** - Business locations
4. **Customer Loyalty** - Customer loyalty accounts and points
5. **Rewards** - Redeemable rewards and discounts
6. **Stamp Cards** - Digital stamp collection system
7. **Super Admin** - System-wide administration

---

## 🏢 **Core Models**

### **1. Tenant Model** (`tenant.model.js`)
Manages individual businesses in the multi-tenant system.

**Key Features:**
- Business profile management
- Subscription plan handling
- Usage limits and statistics
- Configuration management

**Usage Example:**
```javascript
const { Tenant } = require('../models');

// Create a new business
const newTenant = await Tenant.create({
  business_name: "Vape Shop London",
  business_email: "contact@vapeshop.com",
  business_phone: "+44 20 1234 5678",
  subscription_plan: "premium",
  max_stores: 5,
  max_customers: 5000
});

// Get tenant statistics
const stats = await Tenant.getTenantStats(tenantId);
```

### **2. User Model** (`user.model.js`)
Multi-role user management with tenant isolation.

**User Roles:**
- `super_admin` - System-wide access
- `tenant_admin` - Business-level administration
- `store_manager` - Store-level management
- `staff` - Basic operations (scan stamps, process purchases)
- `customer` - Limited access to own data

**Key Features:**
- Role-based permissions
- Store staff assignments
- Permission checking methods
- Tenant isolation

**Usage Example:**
```javascript
const { User } = require('../models');

// Create a staff member
const staff = await User.create({
  tenant_id: tenantId,
  email: "staff@vapeshop.com",
  password_hash: hashedPassword,
  first_name: "John",
  last_name: "Doe",
  role: "staff"
});

// Check permissions
if (user.canScanStamps()) {
  // Allow stamp scanning
}

// Assign to store
await User.assignToStore(userId, storeId, 'staff', tenantId);
```

### **3. Super Admin Model** (`superAdmin.model.js`)
System-wide administration and tenant management.

**Key Features:**
- Tenant creation and management
- System-wide statistics
- Tenant suspension/activation
- System activity monitoring

**Usage Example:**
```javascript
const { SuperAdmin } = require('../models');

// Get system overview
const stats = await SuperAdmin.getSystemStats();
const tenantOverview = await SuperAdmin.getTenantOverview();

// Suspend a tenant
await SuperAdmin.suspendTenant(tenantId, "Payment overdue");
```

---

## 🏪 **Business Models**

### **4. Store Model** (`store.model.js`)
Manages business locations and store operations.

**Key Features:**
- Store profile management
- Staff assignments
- Location-based queries
- Store statistics

**Usage Example:**
```javascript
const { Store } = require('../models');

// Create a new store
const store = await Store.create({
  tenant_id: tenantId,
  name: "Vape Shop - Oxford Street",
  address: "123 Oxford Street, London",
  city: "London",
  country: "UK",
  store_manager_id: managerId
});

// Find nearby stores
const nearbyStores = await Store.getNearbyStores(
  latitude, longitude, 10, tenantId
);

// Get store statistics
const stats = await Store.getStoreStats(storeId, tenantId);
```

### **5. Customer Loyalty Model** (`customerLoyalty.model.js`)
Manages customer loyalty accounts and point transactions.

**Key Features:**
- Point earning and redemption
- Transaction history
- Level progression
- Loyalty number generation

**Usage Example:**
```javascript
const { CustomerLoyalty } = require('../models');

// Create loyalty account
const loyalty = await CustomerLoyalty.create({
  tenant_id: tenantId,
  user_id: userId,
  loyalty_number: await CustomerLoyalty.generateLoyaltyNumber(tenantId)
});

// Add points
await CustomerLoyalty.addPoints(
  loyaltyId, 100, "Purchase reward", storeId, staffId, tenantId
);

// Redeem points
await CustomerLoyalty.redeemPoints(
  loyaltyId, 50, "Reward redemption", storeId, staffId, tenantId
);

// Get transaction history
const history = await CustomerLoyalty.getTransactionHistory(
  loyaltyId, { limit: 10 }, tenantId
);
```

### **6. Reward Model** (`reward.model.js`)
Manages redeemable rewards and customer redemptions.

**Reward Types:**
- `discount` - Percentage or fixed amount off
- `free_item` - Free product
- `cashback` - Cash back rewards

**Key Features:**
- Reward availability checking
- Redemption limits
- Popularity tracking
- Value calculations

**Usage Example:**
```javascript
const { Reward } = require('../models');

// Create a reward
const reward = await Reward.create({
  tenant_id: tenantId,
  name: "10% Off Next Purchase",
  description: "Get 10% off your next purchase",
  points_cost: 500,
  discount_percentage: 10,
  reward_type: "discount",
  max_redemptions: 100
});

// Get available rewards for customer
const availableRewards = await Reward.getAvailableRewards(
  customerPoints, tenantId
);

// Redeem reward
const redemption = await Reward.redeemReward(
  rewardId, loyaltyId, storeId, staffId, tenantId
);
```

### **7. Stamp Card Model** (`stampCard.model.js`)
Manages digital stamp collection and completion tracking.

**Key Features:**
- Stamp addition and tracking
- Card completion detection
- Progress calculation
- Employee tracking

**Usage Example:**
```javascript
const { StampCard } = require('../models');

// Create a stamp card
const stampCard = await StampCard.create({
  tenant_id: tenantId,
  customer_loyalty_id: loyaltyId,
  card_name: "Buy 5 Get 1 Free",
  total_stamps: 5,
  reward_description: "Free vape juice"
});

// Add stamp (employee action)
await StampCard.addStamp(
  stampCardId, 1, "Purchase made", storeId, staffId, tenantId
);

// Complete card when full
if (stampCard.isFull()) {
  await StampCard.completeCard(
    stampCardId, "Free vape juice", storeId, staffId, tenantId
  );
}

// Get stamp history
const history = await StampCard.getStampHistory(stampCardId, {}, tenantId);
```

---

## 🔐 **Security & Permissions**

### **Role-Based Access Control**
Each user has specific permissions based on their role:

```javascript
// Permission checking
if (user.hasPermission('scan_stamps')) {
  // Allow stamp scanning
}

if (user.canManageUsers()) {
  // Allow user management
}
```

### **Tenant Isolation**
All data is automatically filtered by tenant:

```javascript
// All queries automatically include tenant_id filter
const users = await User.findAll({}, tenantId);
const stores = await Store.findAll({}, tenantId);
```

### **Row-Level Security (RLS)**
Database-level security policies ensure data isolation:

```sql
-- Automatic tenant filtering
CREATE POLICY tenant_isolation_users ON users 
FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## 📈 **Analytics & Reporting**

### **Tenant Statistics**
```javascript
// Get comprehensive tenant stats
const tenantStats = await Tenant.getTenantStats(tenantId);
// Returns: total_users, total_stores, total_loyalty_accounts, etc.
```

### **Store Performance**
```javascript
// Get store-specific statistics
const storeStats = await Store.getStoreStats(storeId, tenantId);
// Returns: total_staff, total_purchases, total_revenue, etc.
```

### **Loyalty Analytics**
```javascript
// Get loyalty program statistics
const loyaltyStats = await CustomerLoyalty.getLoyaltyStats(tenantId);
// Returns: total_customers, avg_points, total_earned, etc.
```

### **Stamp Card Analytics**
```javascript
// Get stamp program statistics
const stampStats = await StampCard.getStampCardStats(tenantId);
// Returns: total_cards, completed_cards, avg_stamps, etc.
```

---

## 🔄 **Transaction Management**

### **Atomic Operations**
All critical operations use database transactions:

```javascript
// Example: Adding points with transaction history
await CustomerLoyalty.addPoints(loyaltyId, points, reason, storeId, staffId, tenantId);
// This automatically:
// 1. Updates loyalty account
// 2. Records transaction
// 3. Handles rollback on errors
```

### **Audit Trail**
All changes are logged for compliance:

```javascript
// Automatic audit logging
// - User actions
// - Data changes
// - System events
// - Security events
```

---

## 🚀 **Usage Examples**

### **Complete Customer Journey**
```javascript
const { User, CustomerLoyalty, StampCard, Reward } = require('../models');

// 1. Customer registers
const customer = await User.create({
  tenant_id: tenantId,
  email: "customer@example.com",
  password_hash: hashedPassword,
  first_name: "Jane",
  last_name: "Smith",
  role: "customer"
});

// 2. Create loyalty account
const loyalty = await CustomerLoyalty.create({
  tenant_id: tenantId,
  user_id: customer.id,
  loyalty_number: await CustomerLoyalty.generateLoyaltyNumber(tenantId)
});

// 3. Staff adds stamp
await StampCard.addStamp(
  stampCardId, 1, "Purchase", storeId, staffId, tenantId
);

// 4. Customer earns points
await CustomerLoyalty.addPoints(
  loyalty.id, 100, "Purchase reward", storeId, staffId, tenantId
);

// 5. Customer redeems reward
await Reward.redeemReward(
  rewardId, loyalty.id, storeId, staffId, tenantId
);
```

### **Staff Management**
```javascript
// Assign staff to store
await User.assignToStore(userId, storeId, 'staff', tenantId);

// Get store staff
const staff = await Store.getStoreStaff(storeId, tenantId);

// Check staff permissions
if (staff.canScanStamps()) {
  // Allow stamp scanning
}
```

---

## 📋 **Database Migration**

Run the migration to create all tables:

```bash
# Run the migration
psql -d your_database -f src/database/migrations/002_multi_tenant_loyalty_system.sql
```

The migration includes:
- All tables with proper relationships
- Indexes for performance
- Row-level security policies
- Default roles and permissions
- Triggers for automatic timestamps

---

## 🔧 **Configuration**

### **Environment Variables**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=loyalty_system
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# App
NODE_ENV=development
PORT=3000
```

### **Tenant Context Setup**
```javascript
// Set tenant context for all operations
await db.setTenant(tenantId);

// All subsequent queries will be filtered by tenant
const users = await User.findAll();
const stores = await Store.findAll();
```

---

## 🧪 **Testing**

### **Model Testing**
```javascript
// Example test for User model
describe('User Model', () => {
  it('should create a user with tenant isolation', async () => {
    const user = await User.create({
      tenant_id: tenantId,
      email: 'test@example.com',
      password_hash: 'hash',
      first_name: 'Test',
      last_name: 'User'
    });
    
    expect(user.tenant_id).toBe(tenantId);
    expect(user.role).toBe('customer');
  });
});
```

---

## 📚 **API Integration**

### **Controller Example**
```javascript
// Example controller using models
const { User, CustomerLoyalty, StampCard } = require('../models');

class CustomerController {
  async getCustomerProfile(req, res) {
    try {
      const { tenantId, userId } = req.user;
      
      const user = await User.findById(userId, tenantId);
      const loyalty = await CustomerLoyalty.findByUserId(userId, tenantId);
      const stampCards = await StampCard.findActiveByCustomerLoyaltyId(
        loyalty.id, tenantId
      );
      
      res.json({
        user: user.toJSON(),
        loyalty: loyalty.toJSON(),
        stampCards: stampCards.map(card => card.toJSON())
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

---

## 🎯 **Key Benefits**

✅ **Complete Multi-Tenancy** - Full data isolation between businesses  
✅ **Role-Based Security** - Granular permissions for different user types  
✅ **Scalable Architecture** - Supports unlimited businesses and users  
✅ **Comprehensive Tracking** - Full audit trail of all operations  
✅ **Employee Monitoring** - Track which staff performed which actions  
✅ **Flexible Rewards** - Multiple reward types and redemption methods  
✅ **Digital Stamp Cards** - Modern replacement for physical stamp cards  
✅ **Performance Optimized** - Proper indexing and query optimization  
✅ **Transaction Safety** - Atomic operations with rollback support  
✅ **Easy Integration** - Clean API for frontend and mobile apps  

This comprehensive model system provides everything needed for a modern, scalable loyalty system with complete multi-tenant support! 🚀 