const express = require("express");
const { body } = require("express-validator");
const SupabaseAuthController = require("../controllers/supabase-auth.controller");
const {
  authenticateUser,
  requireRole,
  requireAdmin,
} = require("../middleware/supabase-auth.middleware");
const { validate } = require("../middleware/validation.middleware");

const router = express.Router();

// Validation rules
const signUpValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
];

const createUserValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("role")
    .optional()
    .isIn(["super_admin", "admin", "manager", "staff", "customer"])
    .withMessage("Invalid role specified"),
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
];

const updateUserValidation = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("role")
    .isIn(["super_admin", "admin", "manager", "staff", "customer"])
    .withMessage("Invalid role specified"),
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
];

const signInValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

const refreshTokenValidation = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

const changePasswordValidation = [
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
];

const requestPasswordResetValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

const resetPasswordValidation = [
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  body("access_token")
    .notEmpty()
    .withMessage("Access token is required"),
];

const updateProfileValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
];

// Public routes
router.post(
  "/signup",
  signUpValidation,
  validate,
  SupabaseAuthController.signUp
);
router.post(
  "/signin",
  signInValidation,
  validate,
  SupabaseAuthController.signIn
);
router.post(
  "/refresh-token",
  refreshTokenValidation,
  validate,
  SupabaseAuthController.refreshToken
);

// Password reset routes (public)
router.post(
  "/request-password-reset",
  requestPasswordResetValidation,
  validate,
  SupabaseAuthController.requestPasswordReset
);
router.post(
  "/reset-password",
  resetPasswordValidation,
  validate,
  SupabaseAuthController.resetPassword
);
router.get(
  "/verify-reset-token",
  SupabaseAuthController.verifyResetToken
);

// Protected routes
router.post("/signout", authenticateUser, SupabaseAuthController.signOut);
router.get("/profile", authenticateUser, SupabaseAuthController.getProfile);
router.put(
  "/profile",
  updateProfileValidation,
  validate,
  authenticateUser,
  SupabaseAuthController.updateProfile
);
router.post(
  "/change-password",
  changePasswordValidation,
  validate,
  authenticateUser,
  SupabaseAuthController.changePassword
);

// Admin routes
router.get(
  "/users",
  authenticateUser,
  requireAdmin,
  SupabaseAuthController.getAllUsers
);
router.post(
  "/users",
  createUserValidation,
  validate,
  authenticateUser,
  requireAdmin,
  SupabaseAuthController.createUser
);
router.put(
  "/users/:userId",
  updateUserValidation,
  validate,
  authenticateUser,
  requireAdmin,
  SupabaseAuthController.updateUser
);
router.delete(
  "/users/:userId",
  authenticateUser,
  requireAdmin,
  SupabaseAuthController.deleteUser
);

module.exports = router;
