const mongoose = require("mongoose");
const User = require("../models/User");
const Company = require("../models/Company");

// Create Company Admin
const createCompanyAdmin = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    // Validate company ID
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID.",
      });
    }

    // Validate input
    if (name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether company exists
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    // Prevent provisioning for inactive companies
    if (company.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot create an admin for an inactive company.",
      });
    }

    // Check whether email is already registered
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    // Create Company Admin
    const companyAdmin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "company_admin",
      company: company._id,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Company Admin created successfully.",
      data: {
        user: {
          id: companyAdmin._id,
          name: companyAdmin.name,
          email: companyAdmin.email,
          role: companyAdmin.role,
          company: companyAdmin.company,
          status: companyAdmin.status,
        },
      },
    });
  } catch (error) {
    // Handle duplicate email conflicts
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    console.error("Create Company Admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Company Admin.",
    });
  }
};
// List Company Admins for the Super Admin dashboard
const getCompanyAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "company_admin" })
      .select("name email company status createdAt")
      .populate("company", "name code")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: { admins },
    });
  } catch (error) {
    console.error("Get Company Admins error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load Company Admins.",
    });
  }
};
module.exports = {
  createCompanyAdmin,
  getCompanyAdmins,
};