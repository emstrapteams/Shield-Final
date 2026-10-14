
const mongoose = require("mongoose");
const Company = require("../models/Company");

// Create Company
const createCompany = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Company name and code are required.",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    const existingCompany = await Company.findOne({
      code: normalizedCode,
    });

    if (existingCompany) {
      return res.status(409).json({
        success: false,
        message: "Company code already exists.",
      });
    }

    const company = await Company.create({
      name: name.trim(),
      code: normalizedCode,
    });

    return res.status(201).json({
      success: true,
      message: "Company created successfully.",
      data: { company },
    });
  } catch (error) {
    console.error("Create company error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create company.",
    });
  }
};

// Get all Companies
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { companies },
    });
  } catch (error) {
    console.error("Get companies error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch companies.",
    });
  }
};

// Get Company by ID
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID.",
      });
    }

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { company },
    });
  } catch (error) {
    console.error("Get company error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch company.",
    });
  }
};

// Update Company
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID.",
      });
    }

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    if (code) {
      const normalizedCode = code.trim().toUpperCase();

      const existingCompany = await Company.findOne({
        code: normalizedCode,
        _id: { $ne: company._id },
      });

      if (existingCompany) {
        return res.status(409).json({
          success: false,
          message: "Company code already exists.",
        });
      }

      company.code = normalizedCode;
    }

    if (name) {
      company.name = name.trim();
    }

    await company.save();

    return res.status(200).json({
      success: true,
      message: "Company updated successfully.",
      data: { company },
    });
  } catch (error) {
    console.error("Update company error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update company.",
    });
  }
};

// Update Company Status
const updateCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "active",
      "suspended",
      "deactivated",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company status.",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID.",
      });
    }

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    company.status = status;

    await company.save();

    return res.status(200).json({
      success: true,
      message: "Company status updated successfully.",
      data: { company },
    });
  } catch (error) {
    console.error("Update company status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update company status.",
    });
  }
};

module.exports = {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  updateCompanyStatus,
};
