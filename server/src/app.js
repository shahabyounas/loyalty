const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const supabaseAuthRoutes = require("./routes/supabase-auth.routes");
const userRoutes = require("./routes/user.routes");
const loyaltyRoutes = require("./routes/loyalty.routes");
const storesRoutes = require("./routes/stores.routes");
const rewardsRoutes = require("./routes/rewards.routes");
const { errorHandler } = require("./middleware/error.middleware");
const { notFoundHandler } = require("./middleware/notFound.middleware");

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS configuration - Allow any origin and any method
app.use(
  cors({
    origin: true, // Allow any origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    exposedHeaders: ["Content-Length", "X-Requested-With"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Handle preflight requests
app.options("*", cors());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    cors: {
      origin: req.headers.origin,
      message: "CORS allows any origin",
    },
  });
});

// CORS test endpoint
app.get("/api/cors-test", (req, res) => {
  res.status(200).json({
    message: "CORS is working!",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", supabaseAuthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/stores", storesRoutes);
app.use("/api/rewards", rewardsRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
