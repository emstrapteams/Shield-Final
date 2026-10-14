
const express = require("express");
const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const companyIsolation = require("../middleware/companyIsolation");

const {
  equipmentReport,
  fireExtinguisherReport,
  firstAidReport,
  inspectionReport,
  trainingReport,
  drillReport,
  companySafetySummaryReport,
} = require("../controllers/reportController");

const router = express.Router();

router.use(protect);
router.use(authorize("company_admin"));
router.use(companyIsolation);

router.get("/equipment", equipmentReport);
router.get("/fire-extinguishers", fireExtinguisherReport);
router.get("/first-aid-kits", firstAidReport);
router.get("/inspections", inspectionReport);
router.get("/training", trainingReport);
router.get("/drills", drillReport);
router.get("/company-safety-summary", companySafetySummaryReport);

module.exports = router;
