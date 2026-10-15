
const express = require("express");

const {
  createCompanyAdmin,
  getCompanyAdmins,
} = require("../controllers/companyAdminController");

const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const router = express.Router();

// Only authenticated Super Admins can access these routes
router.use(protect);
router.use(authorize("super_admin"));

// List all Company Admins
router.get("/admins", getCompanyAdmins);

// Create a Company Admin for a specific company
router.post("/:companyId/admin", createCompanyAdmin);

module.exports = router;
