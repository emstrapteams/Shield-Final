const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const { protect } = require("./middleware/auth");
const http = require("http");
const { initializeSocket } = require("./config/socket");

const app = express();
const httpServer = http.createServer(app);
initializeSocket(httpServer);
connectDB();

const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const companyAdminRoutes = require("./routes/companyAdminRoutes");
const employeeAccountRoutes = require("./routes/employeeAccountRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("../intern-modules/routes/dashboardRoutes");

const authorize = require("./middleware/authorize");
const companyIsolation = require("./middleware/companyIsolation");

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
const superAdminCompanyViewRoutes = require("../intern-modules/routes/superAdminCompanyViewRoutes");

// -----------------------------
// Middleware
// -----------------------------

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// -----------------------------
// Routes
// -----------------------------

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
// Register the specific administrator routes first
app.use("/api/companies", companyAdminRoutes);

// Register general company routes after
app.use("/api/companies", companyRoutes);
app.use("/api/employees", employeeAccountRoutes);
app.use("/api/emergencies", emergencyRoutes);

app.use("/api/reports", reportRoutes);

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
app.use("/api/fire-extinguishers", safetyModuleAccess, fireExtinguisherRoutes);
app.use("/api/first-aid-kits", safetyModuleAccess, firstAidKitRoutes);
app.use("/api/inspections", safetyModuleAccess, inspectionRoutes);
app.use("/api/corrective-actions", safetyModuleAccess, correctiveActionRoutes);
app.use("/api/emergency-resources", safetyModuleAccess, emergencyResourceRoutes);
app.use("/api/drills", safetyModuleAccess, drillRoutes);
app.use("/api/training-programs", safetyModuleAccess, trainingProgramRoutes);
app.use("/api/training-sessions", safetyModuleAccess, trainingSessionRoutes);
app.use("/api/training-attendance", safetyModuleAccess, trainingAttendanceRoutes);
app.use("/api/training-dashboard", safetyModuleAccess, trainingDashboardRoutes);
app.use("/api/super-admin/companies", superAdminCompanyViewRoutes);

// -----------------------------s
// Health Check
// -----------------------------

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EMSTRAP Shield backend is running"
  });
});

// -----------------------------
// 404 Handler
// -----------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// -----------------------------
// Start Server
// -----------------------------

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`EMSTRAP Shield server running on port ${PORT}`);
});