// Permission-based menu configuration for Admin Dashboard
// This file centralizes all menu permissions and descriptions

export const MENU_PERMISSIONS = {
  // System permissions
  SYSTEM_ADMIN: "*",
  SUPER_ADMIN: "super_admin",

  // User management
  USER_MANAGE: "user_manage",
  USER_VIEW: "user_view",
  USER_CREATE: "user_create",
  USER_UPDATE: "user_update",
  USER_DELETE: "user_delete",

  // Store management
  STORE_MANAGE: "store_manage",
  STORE_VIEW: "store_view",
  STORE_CREATE: "store_create",
  STORE_UPDATE: "store_update",
  STORE_DELETE: "store_delete",

  // Reward management
  REWARD_MANAGE: "reward_manage",
  REWARD_VIEW: "reward_view",
  REWARD_CREATE: "reward_create",
  REWARD_UPDATE: "reward_update",
  REWARD_DELETE: "reward_delete",

  // Settings management
  SETTINGS_MANAGE: "settings_manage",
  SETTINGS_VIEW: "settings_view",
  SETTINGS_UPDATE: "settings_update",

  // Staff scanner
  STAFF_SCANNER: "staff_scanner",
  QR_SCANNER: "qr_scanner",
};

// Menu configuration with permission requirements
export const MENU_CONFIG = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "📊",
    component: "Dashboard",
    permissions: [MENU_PERMISSIONS.SYSTEM_ADMIN, MENU_PERMISSIONS.SUPER_ADMIN], // Everyone can see dashboard
    description: "Overview and analytics",
    category: "overview",
  },
  {
    id: "users",
    label: "Users",
    icon: "👥",
    component: "Users",
    permissions: [
      MENU_PERMISSIONS.USER_MANAGE,
      MENU_PERMISSIONS.USER_VIEW,
      MENU_PERMISSIONS.SUPER_ADMIN,
    ],
    description: "Manage system users",
    category: "administration",
  },
  {
    id: "stores",
    label: "Stores",
    icon: "🏪",
    component: "Stores",
    permissions: [
      MENU_PERMISSIONS.STORE_MANAGE,
      MENU_PERMISSIONS.STORE_VIEW,
      MENU_PERMISSIONS.SUPER_ADMIN,
    ],
    description: "Manage store locations",
    category: "operations",
  },
  {
    id: "rewards",
    label: "Rewards",
    icon: "🎁",
    component: "Rewards",
    permissions: [
      MENU_PERMISSIONS.REWARD_MANAGE,
      MENU_PERMISSIONS.REWARD_VIEW,
      MENU_PERMISSIONS.SUPER_ADMIN,
    ],
    description: "Manage rewards and offers",
    category: "loyalty",
  },
  {
    id: "staff-scanner",
    label: "Staff Scanner",
    icon: "📱",
    component: "StaffScanner",
    permissions: [MENU_PERMISSIONS.STAFF_SCANNER, MENU_PERMISSIONS.SUPER_ADMIN],
    description: "Scan QR codes to add stamps",
    category: "operations",
  },
  {
    id: "qr-scanner",
    label: "QR Code Scanner",
    icon: "📱",
    component: "QR_SCANNER",
    permissions: [MENU_PERMISSIONS.QR_SCANNER, MENU_PERMISSIONS.SUPER_ADMIN],
    description: "Scan customer QR codes to add stamps",
    category: "operations",
  },
  {
    id: "settings",
    label: "Settings",
    icon: "⚙️",
    component: "Settings",
    permissions: [
      MENU_PERMISSIONS.SETTINGS_MANAGE,
      MENU_PERMISSIONS.SETTINGS_VIEW,
      MENU_PERMISSIONS.SUPER_ADMIN,
    ],
    description: "System configuration",
    category: "administration",
  },
];

// Permission groups for better organization
export const PERMISSION_GROUPS = {
  system: {
    name: "System",
    permissions: [MENU_PERMISSIONS.SYSTEM_ADMIN, MENU_PERMISSIONS.SUPER_ADMIN],
  },
  user: {
    name: "User Management",
    permissions: [
      MENU_PERMISSIONS.USER_MANAGE,
      MENU_PERMISSIONS.USER_VIEW,
      MENU_PERMISSIONS.USER_CREATE,
      MENU_PERMISSIONS.USER_UPDATE,
      MENU_PERMISSIONS.USER_DELETE,
      MENU_PERMISSIONS.SUPER_ADMIN,
    ],
  },
  store: {
    name: "Store Management",
    permissions: [
      MENU_PERMISSIONS.STORE_MANAGE,
      MENU_PERMISSIONS.STORE_VIEW,
      MENU_PERMISSIONS.STORE_CREATE,
      MENU_PERMISSIONS.STORE_UPDATE,
      MENU_PERMISSIONS.STORE_DELETE,
      MENU_PERMISSIONS.SUPER_ADMIN,
    ],
  },
  reward: {
    name: "Reward Management",
    permissions: [
      MENU_PERMISSIONS.REWARD_MANAGE,
      MENU_PERMISSIONS.REWARD_VIEW,
      MENU_PERMISSIONS.REWARD_CREATE,
      MENU_PERMISSIONS.REWARD_UPDATE,
      MENU_PERMISSIONS.REWARD_DELETE,
      MENU_PERMISSIONS.SUPER_ADMIN,
    ],
  },
  staff: {
    name: "Staff Operations",
    permissions: [MENU_PERMISSIONS.STAFF_SCANNER, MENU_PERMISSIONS.SUPER_ADMIN],
  },
  settings: {
    name: "Settings Management",
    permissions: [
      MENU_PERMISSIONS.SETTINGS_MANAGE,
      MENU_PERMISSIONS.SETTINGS_VIEW,
      MENU_PERMISSIONS.SETTINGS_UPDATE,
      MENU_PERMISSIONS.SUPER_ADMIN,
    ],
  },
};

// Helper function to check if user has required permissions
export const hasRequiredPermissions = (
  userPermissions,
  requiredPermissions
) => {
  if (!userPermissions || !userPermissions.length) return false;

  // Check if user has super admin permission - they can see everything
  if (userPermissions.includes(MENU_PERMISSIONS.SUPER_ADMIN)) {
    return true;
  }

  // Check if user has any of the required permissions
  return requiredPermissions.some(
    (permission) =>
      userPermissions.includes(permission) ||
      userPermissions.includes(MENU_PERMISSIONS.SYSTEM_ADMIN)
  );
};

// Helper function to get visible menu items based on user permissions
export const getVisibleMenuItems = (userPermissions) => {
  // If user has super admin permission, show all menu items
  if (
    userPermissions &&
    userPermissions.includes(MENU_PERMISSIONS.SUPER_ADMIN)
  ) {
    return MENU_CONFIG;
  }

  return MENU_CONFIG.filter((item) =>
    hasRequiredPermissions(userPermissions, item.permissions)
  );
};

// Helper function to get menu item by ID
export const getMenuItemById = (id) => {
  return MENU_CONFIG.find((item) => item.id === id);
};

// Helper function to get menu items by category
export const getMenuItemsByCategory = (category) => {
  return MENU_CONFIG.filter((item) => item.category === category);
};
