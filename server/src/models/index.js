// Core Database Models for Loyalty System
// Only the 7 essential models needed for the loyalty system

const Tenant = require("./tenant.model");
const User = require("./user.model");
const Store = require("./store.model");
const Reward = require("./reward.model");
const { UserRewardProgress } = require("./userRewardProgress.model");
const { ScanHistory } = require("./scanHistory.model");
const Role = require("./role.model");

module.exports = {
  // Core 7 models
  Tenant,
  User,
  Store,
  Reward,
  UserRewardProgress,
  ScanHistory,
  Role,
};
