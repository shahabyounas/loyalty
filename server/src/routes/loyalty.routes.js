const express = require("express");
const {
  authenticateToken,
  requireRole,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Placeholder routes - implement as needed
router.get("/", authenticateToken, (req, res) => {
  res.json({ message: "Loyalty routes - implement as needed" });
});

module.exports = router;
