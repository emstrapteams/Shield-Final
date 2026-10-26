
const mongoose = require("mongoose");

const Company = require("../../src/models/Company");
const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Facility = require("../models/Facility");
const Equipment = require("../models/Equipment");
const Inspection = require("../models/Inspection");
const CorrectiveAction = require("../models/CorrectiveAction");
const EmergencyResource = require("../models/EmergencyResource");
const Drill = require("../models/Drill");
const TrainingProgram = require("../models/TrainingProgram");
const TrainingSession = require("../models/TrainingSession");
const Emergency = require("../../src/models/Emergency");

const getCompanyOverview = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID",
      });
    }

    const company = await Company.findById(companyId).lean();

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const companyFilter = { company: company._id };

    const [
      employeeCount,
      departmentCount,
      facilityCount,
      equipmentCount,
      fireExtinguisherCount,
      firstAidKitCount,
      inspectionCount,
      correctiveActionCount,
      emergencyResourceCount,
      drillCount,
      trainingProgramCount,
      trainingSessionCount,
      emergencyCount,
    ] = await Promise.all([
      Employee.countDocuments(companyFilter),
      Department.countDocuments(companyFilter),
      Facility.countDocuments(companyFilter),
      Equipment.countDocuments(companyFilter),
      Equipment.countDocuments({ ...companyFilter, type: "fire_extinguisher" }),
      Equipment.countDocuments({ ...companyFilter, type: "first_aid_kit" }),
      Inspection.countDocuments(companyFilter),
      CorrectiveAction.countDocuments(companyFilter),
      EmergencyResource.countDocuments(companyFilter),
      Drill.countDocuments(companyFilter),
      TrainingProgram.countDocuments(companyFilter),
      TrainingSession.countDocuments(companyFilter),
      Emergency.countDocuments(companyFilter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        company,
        summary: {
          employees: employeeCount,
          departments: departmentCount,
          facilities: facilityCount,
          equipment: equipmentCount,
          fireExtinguishers: fireExtinguisherCount,
          firstAidKits: firstAidKitCount,
          inspections: inspectionCount,
          correctiveActions: correctiveActionCount,
          emergencyResources: emergencyResourceCount,
          drills: drillCount,
          trainingPrograms: trainingProgramCount,
          trainingSessions: trainingSessionCount,
          emergencies: emergencyCount,
        },
      },
    });
  } catch (error) {
    console.error("Super Admin company overview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load company overview",
    });
  }
};

const getCompanyEmployees = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID",
      });
    }

    const company = await Company.findById(companyId).select("_id");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const employees = await Employee.find({
      company: company._id,
    })
      .select("-__v")
      .populate("department", "name")
      .populate("facility", "name")
      .lean();

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error("Super Admin employees error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load company employees",
    });
  }
};

module.exports = { getCompanyOverview, getCompanyEmployees };