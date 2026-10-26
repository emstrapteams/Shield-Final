
const express = require("express");
const { protect } = require("../../src/middleware/auth");
const authorize = require("../../src/middleware/authorize");
const {
  companyIsolation,
  readOnlyForSuperAdmin,
  requireCompanyScope,
} = require("../../src/middleware/companyIsolation");

const {
  getCompanyOverview,
  getCompanyEmployees,
} = require("../controllers/superAdminCompanyViewController");

// Reused controllers from existing Company Admin modules
const departmentController = require("../controllers/departmentController");
const facilityController = require("../controllers/facilityController");
const employeeController = require("../controllers/employeeController");
const equipmentController = require("../controllers/equipmentController");
const fireExtinguisherController = require("../controllers/fireExtinguisherController");
const firstAidKitController = require("../controllers/firstAidKitController");
const inspectionController = require("../controllers/inspectionController");
const correctiveActionController = require("../controllers/correctiveActionController");
const emergencyResourceController = require("../controllers/emergencyResourceController");
const drillController = require("../controllers/drillController");
const trainingProgramController = require("../controllers/trainingProgramController");
const trainingSessionController = require("../controllers/trainingSessionController");
const trainingAttendanceController = require("../controllers/trainingAttendanceController");
const trainingDashboardController = require("../controllers/trainingDashboardController");
const dashboardController = require("../controllers/dashboardController");
const emergencyController = require("../../src/controllers/emergencyController");
const reportController = require("../../src/controllers/reportController");

const router = express.Router();

// Authentication, super_admin authorization, and read-only enforcement
router.use(protect);
router.use(authorize("super_admin"));
router.use(readOnlyForSuperAdmin);

// Scope requests by companyId param
const scopeCompany = [companyIsolation, requireCompanyScope];

// Company overview and summary statistics
router.get("/:companyId/overview", scopeCompany, getCompanyOverview);

// Safety Dashboard metrics
router.get("/:companyId/safety-dashboard", scopeCompany, dashboardController.getOverview);
router.get("/:companyId/dashboard/overview", scopeCompany, dashboardController.getOverview);

// Emergencies and Incidents
router.get("/:companyId/emergencies", scopeCompany, emergencyController.getCompanyEmergencies);
router.get("/:companyId/emergencies/:id", scopeCompany, emergencyController.getEmergencyById);

// Employees
router.get("/:companyId/employees", scopeCompany, employeeController.getEmployees);
router.get("/:companyId/employees-summary", scopeCompany, getCompanyEmployees);
router.get("/:companyId/employees/:id", scopeCompany, employeeController.getEmployeeById);

// Departments
router.get("/:companyId/departments", scopeCompany, departmentController.getDepartments);
router.get("/:companyId/departments/:id", scopeCompany, departmentController.getDepartmentById);
router.get("/:companyId/departments/:id/employees", scopeCompany, departmentController.getDepartmentEmployees);

// Facilities
router.get("/:companyId/facilities", scopeCompany, facilityController.getFacilities);
router.get("/:companyId/facilities/:id", scopeCompany, facilityController.getFacilityById);

// Safety Equipment
router.get("/:companyId/equipment", scopeCompany, equipmentController.getEquipmentList);
router.get("/:companyId/equipment/:id", scopeCompany, equipmentController.getEquipmentById);

// Fire Extinguishers
router.get("/:companyId/fire-extinguishers", scopeCompany, fireExtinguisherController.getFireExtinguishers);
router.get("/:companyId/fire-extinguishers/:id", scopeCompany, fireExtinguisherController.getFireExtinguisherById);

// First-Aid Kits
router.get("/:companyId/first-aid-kits", scopeCompany, firstAidKitController.getFirstAidKits);
router.get("/:companyId/first-aid-kits/:id", scopeCompany, firstAidKitController.getFirstAidKitById);

// Safety Inspections
router.get("/:companyId/inspections", scopeCompany, inspectionController.getInspections);
router.get("/:companyId/inspections/:id", scopeCompany, inspectionController.getInspectionById);

// Corrective Actions
router.get("/:companyId/corrective-actions", scopeCompany, correctiveActionController.getCorrectiveActions);
router.get("/:companyId/corrective-actions/:id", scopeCompany, correctiveActionController.getCorrectiveActionById);

// Emergency Resources (including ambulance, hospital, fire-response coordination)
router.get("/:companyId/emergency-resources", scopeCompany, emergencyResourceController.getEmergencyResources);
router.get("/:companyId/emergency-resources/:id", scopeCompany, emergencyResourceController.getEmergencyResourceById);

// Emergency Drills
router.get("/:companyId/drills", scopeCompany, drillController.getDrills);
router.get("/:companyId/drills/:id", scopeCompany, drillController.getDrillById);

// Employee Training Programs
router.get("/:companyId/training-programs", scopeCompany, trainingProgramController.getPrograms);
router.get("/:companyId/training-programs/:id", scopeCompany, trainingProgramController.getProgramById);

// Training Sessions
router.get("/:companyId/training-sessions", scopeCompany, trainingSessionController.getSessions);
router.get("/:companyId/training-sessions/:id", scopeCompany, trainingSessionController.getSessionById);
router.get("/:companyId/training-sessions/:id/attendance", scopeCompany, trainingSessionController.getSessionAttendance);

// Training Attendance and Dashboard
router.get("/:companyId/training-attendance", scopeCompany, trainingAttendanceController.getAttendance);
router.get("/:companyId/training-dashboard", scopeCompany, trainingDashboardController.getStats);
router.get("/:companyId/training-dashboard/stats", scopeCompany, trainingDashboardController.getStats);

// Reports
router.get("/:companyId/reports/equipment", scopeCompany, reportController.equipmentReport);
router.get("/:companyId/reports/fire-extinguishers", scopeCompany, reportController.fireExtinguisherReport);
router.get("/:companyId/reports/first-aid-kits", scopeCompany, reportController.firstAidReport);
router.get("/:companyId/reports/inspections", scopeCompany, reportController.inspectionReport);
router.get("/:companyId/reports/training", scopeCompany, reportController.trainingReport);
router.get("/:companyId/reports/drills", scopeCompany, reportController.drillReport);
router.get("/:companyId/reports/company-safety-summary", scopeCompany, reportController.companySafetySummaryReport);

module.exports = router;

