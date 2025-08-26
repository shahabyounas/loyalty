// Component mapping for Admin Dashboard
// This file maps component names to their actual React components

import Dashboard from "../components/Dashboard";
import Users from "../components/Users";
import Stores from "../components/Stores";
import Rewards from "../components/Rewards";
import StaffScanner from "../components/StaffScanner";
import QRCodeScanner from "../components/QRCodeScanner";
import StampTransactions from "../components/StampTransactions";
import Settings from "../components/Settings";

// Component mapping object
export const COMPONENT_MAP = {
  Dashboard,
  Users,
  Stores,
  Rewards,
  StaffScanner,
  QR_SCANNER: QRCodeScanner,
  STAMP_TRANSACTIONS: StampTransactions,
  Settings,
};

// Helper function to get component by name
export const getComponentByName = (componentName) => {
  const Component = COMPONENT_MAP[componentName];
  if (!Component) {
    console.warn(`Component '${componentName}' not found in component map`);
    return Dashboard; // Fallback to Dashboard
  }
  return Component;
};

// Helper function to render component by name
export const renderComponentByName = (componentName, props = {}) => {
  const Component = getComponentByName(componentName);
  return <Component {...props} />;
};
