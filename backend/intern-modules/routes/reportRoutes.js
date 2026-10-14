const express = require("express");
const {
  equipmentReport, fireExtinguisherReport, firstAidReport, inspectionReport,
  trainingReport, drillReport, companySafetySummaryReport,
} = require("../controllers/reportController");

const router = express.Router();

router.get("/equipment", equipmentReport);
router.get("/fire-extinguishers", fireExtinguisherReport);
router.get("/first-aid-kits", firstAidReport);
router.get("/inspections", inspectionReport);
router.get("/training", trainingReport);
router.get("/drills", drillReport);
router.get("/company-safety-summary", companySafetySummaryReport);

module.exports = router;
