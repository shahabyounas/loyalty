# 🌱 **Multi-Tenant Loyalty System Seeding Guide**

This guide explains how to seed your multi-tenant loyalty system with sample data for development and testing.

## 🚀 **Quick Start**

### **Run the Seeder**
```bash
# From the server directory
node src/database/seed.js
```

### **What Gets Created**
The seeder will create a complete multi-tenant system with:

✅ **1 Super Admin** - System-wide administrator  
✅ **3 Sample Tenants** - Different business types  
✅ **Complete User Hierarchy** - Admins, managers, staff, customers  
✅ **Multiple Stores** - Based on tenant subscription  
✅ **Loyalty Accounts** - With points and levels  
✅ **Rewards Catalog** - Various reward types  
✅ **Stamp Cards** - Digital stamp collection  

---

## 📊 **Seeding Structure**

### **1. Super Admin**
- **Email**: `superadmin@loyalty.com`
- **Password**: `SuperAdmin123!`
- **Permissions**: Full system access

### **2. Sample Tenants**

#### **Vape Shop London** (Premium)
- **Email**: `contact@vapeshop-london.com`
- **Stores**: 3 locations
- **Max Customers**: 5,000
- **Subscription**: Premium

#### **Cloud Nine Vapes** (Basic)
- **Email**: `info@cloudninevapes.com`
- **Stores**: 1 location
- **Max Customers**: 1,000
- **Subscription**: Basic

#### **Diamond Vape Co** (Premium)
- **Email**: `hello@diamondvape.co.uk`
- **Stores**: 5 locations
- **Max Customers**: 10,000
- **Subscription**: Premium

### **3. User Hierarchy per Tenant**

#### **Tenant Admin**
- **Email**: `admin@[businessname].com`
- **Password**: `Password123!`
- **Role**: `tenant_admin`
- **Permissions**: Full tenant access

#### **Store Managers**
- **Email**: `manager1@[businessname].com`, `manager2@[businessname].com`
- **Password**: `Password123!`
- **Role**: `store_manager`
- **Permissions**: Store-level management

#### **Staff Members**
- **Email**: `staff1@[businessname].com`, `staff2@[businessname].com`
- **Password**: `Password123!`
- **Role**: `staff`
- **Permissions**: Basic operations (scan stamps, process purchases)

#### **Customers**
- **Email**: `customer1@[businessname].com`, `customer2@[businessname].com`
- **Password**: `Password123!`
- **Role**: `customer`
- **Permissions**: View own data

---

## 🏪 **Store Structure**

### **Store Creation**
- **Number**: Based on tenant subscription (1-5 stores)
- **Location**: UK cities with realistic addresses
- **Coordinates**: GPS coordinates for location services
- **Opening Hours**: Standard business hours
- **Managers**: Assigned store managers

### **Example Store**
```
Name: Vape Shop London - Store 1
Address: 100 Main Street, London
City: London
Postal Code: SW1A 1AA
Phone: +44 20 1234 5678
Manager: John Manager
Coordinates: 51.5074, -0.1278
```

---

## 🎁 **Rewards System**

### **Reward Types Created**
1. **10% Off Next Purchase** (500 points)
2. **£5 Off Purchase** (750 points)
3. **Free Vape Juice** (1,000 points)
4. **£10 Cashback** (1,500 points)
5. **20% Off Premium Products** (2,000 points)

### **Reward Categories**
- **Discount**: Percentage or fixed amount off
- **Free Item**: Free product
- **Cashback**: Cash back to account

---

## 🎫 **Stamp Cards**

### **Card Types**
1. **Buy 5 Get 1 Free** (5 stamps)
2. **Buy 10 Get 2 Free** (10 stamps)
3. **Weekly Special** (3 stamps)

### **Features**
- **Random Progress**: Each customer gets 1-2 cards with random stamp progress
- **Expiration**: 30 days from creation
- **Rewards**: Free products and discounts

---

## 🏆 **Loyalty Levels**

### **Level Structure**
1. **Bronze** (0-999 points) - Basic rewards
2. **Silver** (1,000-2,499 points) - Priority support
3. **Gold** (2,500-4,999 points) - Exclusive offers
4. **Platinum** (5,000-9,999 points) - VIP events
5. **Diamond** (10,000+ points) - Personal account manager

### **Customer Setup**
- **Random Points**: 0-1,000 points per customer
- **Random Levels**: Distributed across all levels
- **Loyalty Numbers**: Auto-generated unique identifiers

---

## 🔧 **Configuration**

### **Tenant Configurations**
- **Points per Pound**: 1 point per £1 spent
- **Default Level**: Bronze
- **Points Expiry**: 365 days
- **Stamp Card Expiry**: 30 days
- **Max Stamps per Card**: 10

---

## 🚀 **Usage Examples**

### **Login as Super Admin**
```javascript
// Super admin can manage all tenants
const superAdmin = await SuperAdmin.findByEmail("superadmin@loyalty.com");
const systemStats = await SuperAdmin.getSystemStats();
const tenantOverview = await SuperAdmin.getTenantOverview();
```

### **Login as Tenant Admin**
```javascript
// Tenant admin can manage their business
const tenantAdmin = await User.findByEmail("admin@vapeshop-london.com", tenantId);
const tenantStats = await Tenant.getTenantStats(tenantId);
```

### **Login as Staff**
```javascript
// Staff can scan stamps and process purchases
const staff = await User.findByEmail("staff1@vapeshop-london.com", tenantId);
if (staff.canScanStamps()) {
  // Allow stamp scanning
}
```

### **Login as Customer**
```javascript
// Customer can view their loyalty account
const customer = await User.findByEmail("customer1@vapeshop-london.com", tenantId);
const loyalty = await CustomerLoyalty.findByUserId(customer.id, tenantId);
const stampCards = await StampCard.findActiveByCustomerLoyaltyId(loyalty.id, tenantId);
```

---

## 🧪 **Testing Scenarios**

### **1. Staff Stamp Scanning**
```javascript
// Staff member scans stamp for customer
await StampCard.addStamp(
  stampCardId, 
  1, 
  "Purchase made", 
  storeId, 
  staffId, 
  tenantId
);
```

### **2. Customer Point Earning**
```javascript
// Customer earns points from purchase
await CustomerLoyalty.addPoints(
  loyaltyId, 
  100, 
  "Purchase reward", 
  storeId, 
  staffId, 
  tenantId
);
```

### **3. Reward Redemption**
```javascript
// Customer redeems reward
await Reward.redeemReward(
  rewardId, 
  loyaltyId, 
  storeId, 
  staffId, 
  tenantId
);
```

### **4. Super Admin Management**
```javascript
// Super admin suspends tenant
await SuperAdmin.suspendTenant(tenantId, "Payment overdue");

// Super admin activates tenant
await SuperAdmin.activateTenant(tenantId);
```

---

## 🔄 **Resetting Data**

### **Clear All Data**
```sql
-- WARNING: This will delete all data!
TRUNCATE TABLE users, stores, customer_loyalty, rewards, stamp_cards CASCADE;
DELETE FROM tenants WHERE business_name LIKE '%Sample%';
DELETE FROM super_admins WHERE email = 'superadmin@loyalty.com';
```

### **Re-run Seeder**
```bash
node src/database/seed.js
```

---

## 📋 **Seeder Output**

### **Expected Log Output**
```
Starting comprehensive seeding...
Super admin created: superadmin@loyalty.com
Created 3 sample tenants
Seeding data for tenant: Vape Shop London
Created 8 users for tenant: Vape Shop London
Created 3 stores for tenant: Vape Shop London
Created 2 loyalty accounts for tenant: Vape Shop London
Created 5 rewards for tenant: Vape Shop London
Created 4 stamp cards for tenant: Vape Shop London
Completed seeding for tenant: Vape Shop London
...
Comprehensive seeding completed successfully!

=== SEEDING SUMMARY ===
Super Admin: superadmin@loyalty.com
Tenants Created: 3
  - Vape Shop London (premium)
  - Cloud Nine Vapes (basic)
  - Diamond Vape Co (premium)
======================
```

---

## 🎯 **Key Benefits**

✅ **Complete System Setup** - Ready to use immediately  
✅ **Realistic Data** - Business-like scenarios  
✅ **Multi-Tenant Testing** - Test isolation and permissions  
✅ **Role-Based Testing** - Test all user types  
✅ **Feature Testing** - Test all system features  
✅ **Development Ready** - Perfect for development and testing  

---

## 🚨 **Important Notes**

1. **Passwords**: All users have password `Password123!` (change in production)
2. **Email Verification**: All users are pre-verified for testing
3. **Tenant Isolation**: Each tenant's data is completely isolated
4. **Realistic Data**: Addresses, phone numbers, and business names are realistic
5. **Scalable**: Easy to add more tenants or modify existing data

This comprehensive seeding system provides everything needed to test and develop your multi-tenant loyalty system! 🚀 