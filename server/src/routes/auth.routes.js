const express = require("express");
const { body } = require("express-validator");
const AuthController = require("../controllers/auth.controller");
const {
  authenticateToken,
  authenticateRefreshToken,
} = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validation.middleware");

const router = express.Router();

// Validation rules
const registerValidation = [
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

const loginValidation = [
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
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
];

// Routes
router.post("/register", registerValidation, validate, AuthController.register);
router.post("/login", loginValidation, validate, AuthController.login);
router.post(
  "/refresh-token",
  refreshTokenValidation,
  validate,
  authenticateRefreshToken,
  AuthController.refreshToken
);
router.post(
  "/change-password",
  changePasswordValidation,
  validate,
  authenticateToken,
  AuthController.changePassword
);
router.post("/logout", authenticateToken, AuthController.logout);
router.get("/profile", authenticateToken, AuthController.getProfile);

module.exports = router;
