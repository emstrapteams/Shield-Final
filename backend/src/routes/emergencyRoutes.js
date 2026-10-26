
const express = require("express");

const router = express.Router();

const uploadEvidence = require("../middleware/uploadEvidence");

const {
  createEmergency,
  getMyEmergencies,
  getEmergencyById,
  uploadEmergencyEvidence,
  cancelEmergency,
  getCompanyEmergencies,
  acknowledgeEmergency,
  startEmergencyResponse,
  resolveEmergency,
  closeEmergency,
} = require("../controllers/emergencyController");

const { protect } = require("../middleware/auth");

const authorize = require("../middleware/authorize");

const {
  companyIsolation,
  requireCompanyScope,
} = require("../middleware/companyIsolation");

// All emergency routes require authentication
router.use(protect);

// Employee creates an emergency report
router.post(
  "/",
  authorize("employee"),
  createEmergency
);

// Employee views their own emergency reports
router.get(
  "/my",
  authorize("employee"),
  getMyEmergencies
);

// Company Admin and Super Admin view emergencies belonging to the company
router.get(
  "/",
  authorize("company_admin", "super_admin"),
  companyIsolation,
  requireCompanyScope,
  getCompanyEmergencies
);

// Company Admin acknowledges an emergency
router.patch(
  "/:id/acknowledge",
  authorize("company_admin"),
  acknowledgeEmergency
);

// Company Admin starts emergency response
router.patch(
  "/:id/start-response",
  authorize("company_admin"),
  startEmergencyResponse
);

// Company Admin resolves an emergency
router.patch(
  "/:id/resolve",
  authorize("company_admin"),
  resolveEmergency
);

// Company Admin closes a resolved emergency
router.patch(
  "/:id/close",
  authorize("company_admin"),
  closeEmergency
);

// Employee uploads evidence to their own emergency
router.post(
  "/:id/evidence",
  authorize("employee"),
  uploadEvidence,
  uploadEmergencyEvidence
);

// Employee cancels their own emergency
router.patch(
  "/:id/cancel",
  authorize("employee"),
  cancelEmergency
);

// Employee, Company Admin, or Super Admin views emergency details
router.get(
  "/:id",
  authorize("employee", "company_admin", "super_admin"),
  companyIsolation,
  getEmergencyById
);

module.exports = router;