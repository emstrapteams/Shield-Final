const { fail } = require("../utils/apiResponse");
const TrainingProgram = require("../models/TrainingProgram");
const TrainingSession = require("../models/TrainingSession");
const TrainingAttendance = require("../models/TrainingAttendance");

const validateTrainingProgram = (req, res, next) => {
  const { name, type, requiredSessionsPerYear, status } = req.body;
  const errors = [];

  if (!name || !name.trim()) errors.push("name is required.");
  if (!type || !TrainingProgram.TYPES.includes(type)) {
    errors.push(`type must be one of: ${TrainingProgram.TYPES.join(", ")}`);
  }
  if (requiredSessionsPerYear !== undefined && requiredSessionsPerYear !== null && (isNaN(requiredSessionsPerYear) || requiredSessionsPerYear < 0)) {
    errors.push("requiredSessionsPerYear must be a non-negative number.");
  }
  if (status && !["active", "inactive"].includes(status)) errors.push("status must be active or inactive.");

  if (errors.length) return fail(res, 400, "Validation failed.", errors);
  next();
};

const validateTrainingSession = (req, res, next) => {
  const { program, facility, scheduledDate, status } = req.body;
  const errors = [];

  if (!program) errors.push("program is required.");
  if (!facility) errors.push("facility is required.");
  if (!scheduledDate || isNaN(Date.parse(scheduledDate))) errors.push("scheduledDate must be a valid date.");
  if (status && !TrainingSession.STATUSES.includes(status)) {
    errors.push(`status must be one of: ${TrainingSession.STATUSES.join(", ")}`);
  }

  if (errors.length) return fail(res, 400, "Validation failed.", errors);
  next();
};

const validateTrainingAttendance = (req, res, next) => {
  const { session, employee, status } = req.body;
  const errors = [];

  if (!session) errors.push("session is required.");
  if (!employee) errors.push("employee is required.");
  if (status && !TrainingAttendance.STATUSES.includes(status)) {
    errors.push(`status must be one of: ${TrainingAttendance.STATUSES.join(", ")}`);
  }

  if (errors.length) return fail(res, 400, "Validation failed.", errors);
  next();
};

module.exports = { validateTrainingProgram, validateTrainingSession, validateTrainingAttendance };
