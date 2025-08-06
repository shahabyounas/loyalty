// Database Models for Multi-Tenant Loyalty System
// All models support Row-Level Security (RLS) for tenant isolation

const Tenant = require("./tenant.model");
const User = require("./user.model");
const Store = require("./store.model");
const CustomerLoyalty = require("./customerLoyalty.model");
const StampCard = require("./stampCard.model");
const Reward = require("./reward.model");

module.exports = {
  Tenant,
  User,
  Store,
  CustomerLoyalty,
  StampCard,
  Reward,
};
