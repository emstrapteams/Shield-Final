const express = require("express");
const { validateCompany } = require("../validation/companyValidation");
const {
  createCompany, getCompanies, getCompanyById, getCompanyUsage, updateCompany, setCompanyStatus,
} = require("../controllers/superAdminCompanyController");

const router = express.Router();
// NOTE: Super Admin business CRUD only — Super Admin authentication and
// authorization are NOT implemented here (developed separately). Not
// company-scoped: a Super Admin operates across all companies.

router.get("/", getCompanies);
router.post("/", validateCompany, createCompany);
router.get("/:id", getCompanyById);
router.get("/:id/usage", getCompanyUsage);
router.put("/:id", validateCompany, updateCompany);
router.patch("/:id/status", setCompanyStatus);

module.exports = router;
