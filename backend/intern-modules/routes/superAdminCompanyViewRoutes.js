
const express = require("express");
const { protect } = require("../../src/middleware/auth");
const authorize = require("../../src/middleware/authorize");

const {
  getCompanyOverview,
  getCompanyEmployees,
} = require("../controllers/superAdminCompanyViewController");

const router = express.Router();

// Authentication and role authorization
router.use(protect);
router.use(authorize("super_admin"));

// Read-only company dashboard endpoints
router.get("/:companyId/overview", getCompanyOverview);
router.get("/:companyId/employees", getCompanyEmployees);

module.exports = router;
