
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const { protect } = require("./middleware/auth");
const authorize = require("./middleware/authorize");
const companyIsolation = require("./middleware/companyIsolation");

const app = express();

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://shield-final-frontend.vercel.app",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("CORS blocked origin:", origin);
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));


app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

// Handle preflight requests
app.options(/.*/, cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const companyAdminRoutes = require("./routes/companyAdminRoutes");
const employeeAccountRoutes = require("./routes/employeeAccountRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const reportRoutes = require("./routes/reportRoutes");

const dashboardRoutes = require("../intern-modules/routes/dashboardRoutes");
const departmentRoutes = require("../intern-modules/routes/departmentRoutes");
const facilityRoutes = require("../intern-modules/routes/facilityRoutes");
const safetyEmployeeRoutes = require("../intern-modules/routes/employeeRoutes");
const equipmentRoutes = require("../intern-modules/routes/equipmentRoutes");
const fireExtinguisherRoutes = require("../intern-modules/routes/fireExtinguisherRoutes");
const firstAidKitRoutes = require("../intern-modules/routes/firstAidKitRoutes");
const inspectionRoutes = require("../intern-modules/routes/inspectionRoutes");
const correctiveActionRoutes = require("../intern-modules/routes/correctiveActionRoutes");
const emergencyResourceRoutes = require("../intern-modules/routes/emergencyResourceRoutes");
const drillRoutes = require("../intern-modules/routes/drillRoutes");
const trainingProgramRoutes = require("../intern-modules/routes/trainingProgramRoutes");
const trainingSessionRoutes = require("../intern-modules/routes/trainingSessionRoutes");
const trainingAttendanceRoutes = require("../intern-modules/routes/trainingAttendanceRoutes");
const trainingDashboardRoutes = require("../intern-modules/routes/trainingDashboardRoutes");

// Connect to MongoDB before handling API requests
let dbPromise;

app.use(async (req, res, next) => {
  try {
    if (!dbPromise) {
      dbPromise = connectDB();
    }

    await dbPromise;
    next();
  } catch (error) {
    dbPromise = null;

    console.error("Database connection error:", error.message);

    res.status(503).json({
      success: false,
      message: "Database temporarily unavailable.",
    });
  }
});

// Authentication
app.use("/api/auth", authRoutes);

app.get("/api/auth/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        company: req.user.company,
        status: req.user.status,
      },
    },
  });
});

// Company administration routes must come before general company routes
app.use("/api/companies", companyAdminRoutes);
app.use("/api/companies", companyRoutes);

app.use("/api/employees", employeeAccountRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/reports", reportRoutes);

// Access control for safety modules
const safetyModuleAccess = [
  protect,
  authorize("company_admin"),
  companyIsolation,
];

app.use("/api/dashboard", safetyModuleAccess, dashboardRoutes);
app.use("/api/departments", safetyModuleAccess, departmentRoutes);
app.use("/api/facilities", safetyModuleAccess, facilityRoutes);
app.use("/api/employees", safetyModuleAccess, safetyEmployeeRoutes);
app.use("/api/equipment", safetyModuleAccess, equipmentRoutes);

app.use(
  "/api/fire-extinguishers",
  safetyModuleAccess,
  fireExtinguisherRoutes
);

app.use("/api/first-aid-kits", safetyModuleAccess, firstAidKitRoutes);
app.use("/api/inspections", safetyModuleAccess, inspectionRoutes);

app.use(
  "/api/corrective-actions",
  safetyModuleAccess,
  correctiveActionRoutes
);

app.use(
  "/api/emergency-resources",
  safetyModuleAccess,
  emergencyResourceRoutes
);

app.use("/api/drills", safetyModuleAccess, drillRoutes);

app.use(
  "/api/training-programs",
  safetyModuleAccess,
  trainingProgramRoutes
);

app.use(
  "/api/training-sessions",
  safetyModuleAccess,
  trainingSessionRoutes
);

app.use(
  "/api/training-attendance",
  safetyModuleAccess,
  trainingAttendanceRoutes
);

app.use(
  "/api/training-dashboard",
  safetyModuleAccess,
  trainingDashboardRoutes
);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EMSTRAP Shield backend is running",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;
