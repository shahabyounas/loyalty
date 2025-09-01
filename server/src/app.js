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
const userRewardProgressRoutes = require("./routes/user-reward-progress.routes");
const stampTransactionRoutes = require("./routes/stamp-transactions.routes");
const adminProgressRoutes = require("./routes/admin-progress.routes");
const analyticsRoutes = require("./routes/analytics.routes");
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

// CORS configuration - Allow specific origins and any method
const allowedOrigins = [
  'https://diamondvapesloyalty.co.uk',
  'https://royaltyrewards.co.uk',
  'http://localhost:4200',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:4200'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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
      allowed: req.headers.origin ? allowedOrigins.includes(req.headers.origin) : 'no-origin',
      allowedOrigins: allowedOrigins,
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
app.use("/api/user-reward-progress", userRewardProgressRoutes);
app.use("/api/stamp-transactions", stampTransactionRoutes);
app.use("/api/admin", adminProgressRoutes);
app.use("/api/analytics", analyticsRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
