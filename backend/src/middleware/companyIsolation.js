const mongoose = require("mongoose");
const Company = require("../models/Company");

const companyIsolation = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Safely get any requested company ID from headers, params, body, or query
    const requestedCompanyId =
      req.headers["x-company-id"] ||
      req.params?.companyId ||
      req.body?.company ||
      req.body?.companyId ||
      req.query?.companyId;

    // -----------------------------------------
    // Company Admin / Employee
    // -----------------------------------------
    if (
      req.user.role === "company_admin" ||
      req.user.role === "employee"
    ) {
      if (!req.user.company) {
        return res.status(403).json({
          success: false,
          message: "User is not associated with a company.",
        });
      }

      const userCompanyId = req.user.company.toString();

      // Prevent company switching
      if (
        requestedCompanyId &&
        requestedCompanyId.toString() !== userCompanyId
      ) {
        return res.status(403).json({
          success: false,
          message: "Access to this company is not permitted.",
        });
      }

      // Server-controlled company scope
      req.companyId = req.user.company;

      return next();
    }

    // -----------------------------------------
    // Super Admin
    // -----------------------------------------
    if (req.user.role === "super_admin") {
      // No company specified = platform-wide access
      if (!requestedCompanyId) {
        req.companyId = null;
        return next();
      }

      // Validate company ID format
      if (!mongoose.Types.ObjectId.isValid(requestedCompanyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid company ID.",
        });
      }

      // Verify the company actually exists in the database
      const companyExists = await Company.findById(requestedCompanyId).select("_id").lean();
      if (!companyExists) {
        return res.status(404).json({
          success: false,
          message: "Company not found.",
        });
      }

      req.companyId = new mongoose.Types.ObjectId(
        requestedCompanyId
      );

      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Invalid user role.",
    });
  } catch (error) {
    console.error("Company isolation error:", error);

    return res.status(500).json({
      success: false,
      message: "Company access validation failed.",
    });
  }
};

// Enforces read-only access for Super Admins on company operational records
const readOnlyForSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === "super_admin") {
    const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(req.method);
    if (!isSafeMethod) {
      return res.status(403).json({
        success: false,
        message: "Super Admins have read-only access to company records and cannot modify them.",
      });
    }
  }
  next();
};

// Requires that a companyId has been scoped (essential for Super Admin viewing company data)
const requireCompanyScope = (req, res, next) => {
  if (req.user && req.user.role === "super_admin" && !req.companyId) {
    return res.status(400).json({
      success: false,
      message: "A company ID is required to access company-scoped data.",
    });
  }
  next();
};

module.exports = companyIsolation;
module.exports.companyIsolation = companyIsolation;
module.exports.readOnlyForSuperAdmin = readOnlyForSuperAdmin;
module.exports.requireCompanyScope = requireCompanyScope;