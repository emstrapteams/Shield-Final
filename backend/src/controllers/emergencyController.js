
const mongoose = require("mongoose");

const { emitEmergencyEvent } = require("../config/socket");
const Emergency = require("../models/Emergency");
const Company = require("../models/Company");

const {
  uploadEvidenceToCloudinary,
} = require("../services/evidenceUpload.service");

// Emit a real-time event after a successful database save.
// Socket delivery failures should not turn a successful database
// operation into a failed API response.
const safelyEmitEmergencyEvent = (companyId, event, emergency) => {
  try {
    emitEmergencyEvent(
      companyId,
      event,
      typeof emergency.toObject === "function"
        ? emergency.toObject()
        : emergency
    );
  } catch (error) {
    console.error(`Socket.IO ${event} emission error:`, error.message);
  }
};

// Record an action in the emergency response history.
const addResponseHistory = (
  emergency,
  action,
  performedBy,
  note = ""
) => {
  emergency.responseHistory.push({
    action,
    performedBy,
    note,
    timestamp: new Date(),
  });
};

// Create Emergency Report.
const createEmergency = async (req, res) => {
  try {
    const { type, description, location } = req.body;

    const allowedTypes = [
      "medical",
      "fire",
      "accident",
      "electrical",
      "chemical",
      "gas",
      "vehicle",
      "equipment",
      "security",
      "emergency_alert",
      "other",
    ];

    if (!type || !allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "A valid emergency type is required.",
      });
    }

    // Validate location.
    if (
      !location ||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid GPS coordinates are required.",
      });
    }

    if (
      location.latitude < -90 ||
      location.latitude > 90 ||
      location.longitude < -180 ||
      location.longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "GPS coordinates are out of range.",
      });
    }

    // Get company and employee from authenticated user.
    const companyId = req.user.company;
    const employeeId = req.user._id;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "User is not associated with a company.",
      });
    }

    // Verify company is active.
    const company = await Company.findById(companyId);

    if (!company || company.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Company is inactive or unavailable.",
      });
    }

    // Create emergency with initial response history.
    const emergency = await Emergency.create({
      company: companyId,
      reportedBy: employeeId,
      type,
      description:
        typeof description === "string" ? description.trim() : "",
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy:
          typeof location.accuracy === "number"
            ? location.accuracy
            : null,
        address:
          typeof location.address === "string"
            ? location.address.trim()
            : "",
      },
      status: "triggered",
      responseHistory: [
        {
          action: "triggered",
          performedBy: employeeId,
          note: "Emergency reported by employee.",
          timestamp: new Date(),
        },
      ],
    });

    // Notify connected users in this company only.
    safelyEmitEmergencyEvent(
      companyId,
      "emergency:created",
      emergency
    );

    return res.status(201).json({
      success: true,
      message: "Emergency report created successfully.",
      data: { emergency },
    });
  } catch (error) {
    console.error("Create Emergency error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create emergency report.",
    });
  }
};

// Get emergencies reported by the logged-in employee.
const getMyEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      reportedBy: req.user._id,
      company: req.user.company,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: emergencies.length,
      data: { emergencies },
    });
  } catch (error) {
    console.error("Get My Emergencies error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve emergencies.",
    });
  }
};

// Get a specific emergency.
const getEmergencyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency ID.",
      });
    }

    const targetCompanyId = req.companyId || req.user.company;
    const query = { _id: id };
    if (targetCompanyId) {
      query.company = targetCompanyId;
    }

    const emergency = await Emergency.findOne(query)
      .populate("reportedBy", "name email phone role employeeId")
      .populate("responseHistory.performedBy", "name email role");

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found.",
      });
    }

    // Employees can only view their own reports.
    if (
      req.user.role === "employee" &&
      emergency.reportedBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this emergency.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { emergency },
    });
  } catch (error) {
    console.error("Get Emergency error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve emergency.",
    });
  }
};

// Upload evidence to an emergency.
const uploadEmergencyEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency ID",
      });
    }

    const emergency = await Emergency.findOne({
      _id: id,
      company: user.company,
    });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    // Employees can only upload evidence to their own emergencies.
    if (
      user.role === "employee" &&
      emergency.reportedBy.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only upload evidence to your own emergencies",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one evidence file is required",
      });
    }

    if (emergency.evidence.length + req.files.length > 5) {
      return res.status(400).json({
        success: false,
        message: "An emergency can have a maximum of 5 evidence files",
      });
    }

    const uploadedFiles = await Promise.all(
      req.files.map((file) => uploadEvidenceToCloudinary(file))
    );

    emergency.evidence.push(...uploadedFiles);

    await emergency.save();

    // Notify company dashboards that the evidence has changed.
    safelyEmitEmergencyEvent(
      emergency.company,
      "emergency:updated",
      emergency
    );

    return res.status(200).json({
      success: true,
      message: "Emergency evidence uploaded successfully",
      evidence: emergency.evidence,
    });
  } catch (error) {
    console.error("Evidence upload error:", error);

    const statusCode =
      error.code === "EVIDENCE_STORAGE_NOT_CONFIGURED" ? 503 :
      error.http_code === 401 || error.http_code === 403 ? 502 :
      500;
    const message =
      error.code === "EVIDENCE_STORAGE_NOT_CONFIGURED"
        ? "Photo storage is not configured. Set CLOUDINARY_URL or all three Cloudinary credentials in the backend production environment."
        : error.http_code === 401 || error.http_code === 403
          ? "Photo storage rejected its credentials. Check the Cloudinary production credentials."
          : "Failed to upload emergency evidence. Check the backend function logs for the upload error.";

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

// Cancel an emergency reported by the logged-in employee.
const cancelEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency ID.",
      });
    }

    if (
      typeof cancellationReason !== "string" ||
      cancellationReason.trim().length < 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a cancellation reason of at least 5 characters.",
      });
    }

    if (cancellationReason.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason cannot exceed 500 characters.",
      });
    }

    const emergency = await Emergency.findOne({
      _id: id,
      company: req.user.company,
      reportedBy: req.user._id,
    });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found.",
      });
    }

    if (emergency.status !== "triggered") {
      return res.status(400).json({
        success: false,
        message:
          "This emergency cannot be cancelled because its status is no longer triggered.",
      });
    }

    emergency.status = "cancelled";
    emergency.cancellationReason = cancellationReason.trim();

    addResponseHistory(
      emergency,
      "cancelled",
      req.user._id,
      cancellationReason.trim()
    );

    await emergency.save();

    safelyEmitEmergencyEvent(
      emergency.company,
      "emergency:updated",
      emergency
    );

    return res.status(200).json({
      success: true,
      message: "Emergency cancelled successfully.",
      data: { emergency },
    });
  } catch (error) {
    console.error("Cancel Emergency error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel emergency.",
    });
  }
};

// Get all emergencies belonging to the logged-in Company Admin's company.
const getCompanyEmergencies = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    const currentPage = Number(page);
    const pageLimit = Number(limit);

    if (
      !Number.isInteger(currentPage) ||
      !Number.isInteger(pageLimit) ||
      currentPage < 1 ||
      pageLimit < 1 ||
      pageLimit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters.",
      });
    }

    const allowedStatuses = [
      "triggered",
      "alert_created",
      "response_in_progress",
      "resolved",
      "closed",
      "cancelled",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency status.",
      });
    }

    const allowedTypes = [
      "medical",
      "fire",
      "accident",
      "electrical",
      "chemical",
      "gas",
      "vehicle",
      "equipment",
      "security",
      "emergency_alert",
      "other",
    ];

    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency type.",
      });
    }

    // Company isolation.
    const companyScope = req.companyId || req.user.company;
    if (!companyScope) {
      return res.status(400).json({
        success: false,
        message: "A company ID is required to access company emergencies.",
      });
    }

    const filter = {
      company: companyScope,
    };

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    const skip = (currentPage - 1) * pageLimit;

    const [emergencies, total] = await Promise.all([
      Emergency.find(filter)
        .populate("reportedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      Emergency.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: emergencies.length,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageLimit),
      data: { emergencies },
    });
  } catch (error) {
    console.error("Get company emergencies error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve company emergencies.",
    });
  }
};

// Acknowledge an emergency.
const acknowledgeEmergency = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency ID.",
      });
    }

    const emergency = await Emergency.findOne({
      _id: id,
      company: req.user.company,
    });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found.",
      });
    }

    if (emergency.status !== "triggered") {
      return res.status(400).json({
        success: false,
        message: "Only triggered emergencies can be acknowledged.",
      });
    }

    emergency.status = "alert_created";
    emergency.acknowledgedBy = req.user._id;
    emergency.acknowledgedAt = new Date();

    addResponseHistory(
      emergency,
      "acknowledged",
      req.user._id,
      "Emergency acknowledged by Company Admin."
    );

    await emergency.save();

    safelyEmitEmergencyEvent(
      emergency.company,
      "emergency:updated",
      emergency
    );

    return res.status(200).json({
      success: true,
      message: "Emergency acknowledged successfully.",
      data: { emergency },
    });
  } catch (error) {
    console.error("Acknowledge Emergency error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to acknowledge emergency.",
    });
  }
};

// Start emergency response.
const startEmergencyResponse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency ID.",
      });
    }

    const emergency = await Emergency.findOne({
      _id: id,
      company: req.user.company,
    });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found.",
      });
    }

    if (emergency.status !== "alert_created") {
      return res.status(400).json({
        success: false,
        message: "Only acknowledged emergencies can enter response.",
      });
    }

    emergency.status = "response_in_progress";
    emergency.responseStartedBy = req.user._id;
    emergency.responseStartedAt = new Date();

    addResponseHistory(
      emergency,
      "response_started",
      req.user._id,
      "Emergency response initiated."
    );

    await emergency.save();

    safelyEmitEmergencyEvent(
      emergency.company,
      "emergency:updated",
      emergency
    );

    return res.status(200).json({
      success: true,
      message: "Emergency response started successfully.",
      data: { emergency },
    });
  } catch (error) {
    console.error("Start Emergency Response error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start emergency response.",
    });
  }
};

// Resolve an emergency.
const resolveEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency ID.",
      });
    }

    if (note !== undefined && typeof note !== "string") {
      return res.status(400).json({
        success: false,
        message: "Resolution note must be a string.",
      });
    }

    if (typeof note === "string" && note.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Resolution note cannot exceed 1000 characters.",
      });
    }

    const emergency = await Emergency.findOne({
      _id: id,
      company: req.user.company,
    });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found.",
      });
    }

    if (emergency.status !== "response_in_progress") {
      return res.status(400).json({
        success: false,
        message:
          "Only emergencies with an active response can be resolved.",
      });
    }

    emergency.status = "resolved";
    emergency.resolvedBy = req.user._id;
    emergency.resolvedAt = new Date();

    addResponseHistory(
      emergency,
      "resolved",
      req.user._id,
      note ? note.trim() : "Emergency marked as resolved."
    );

    await emergency.save();

    safelyEmitEmergencyEvent(
      emergency.company,
      "emergency:updated",
      emergency
    );

    return res.status(200).json({
      success: true,
      message: "Emergency resolved successfully.",
      data: { emergency },
    });
  } catch (error) {
    console.error("Resolve Emergency error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resolve emergency.",
    });
  }
};

// Close a resolved emergency.
const closeEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency ID.",
      });
    }

    if (note !== undefined && typeof note !== "string") {
      return res.status(400).json({
        success: false,
        message: "Closure note must be a string.",
      });
    }

    if (typeof note === "string" && note.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Closure note cannot exceed 1000 characters.",
      });
    }

    const emergency = await Emergency.findOne({
      _id: id,
      company: req.user.company,
    });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found.",
      });
    }

    if (emergency.status !== "resolved") {
      return res.status(400).json({
        success: false,
        message: "Only resolved emergencies can be closed.",
      });
    }

    emergency.status = "closed";
    emergency.closedBy = req.user._id;
    emergency.closedAt = new Date();

    addResponseHistory(
      emergency,
      "closed",
      req.user._id,
      note ? note.trim() : "Emergency formally closed."
    );

    await emergency.save();

    safelyEmitEmergencyEvent(
      emergency.company,
      "emergency:updated",
      emergency
    );

    return res.status(200).json({
      success: true,
      message: "Emergency closed successfully.",
      data: { emergency },
    });
  } catch (error) {
    console.error("Close Emergency error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to close emergency.",
    });
  }
};

module.exports = {
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
};
