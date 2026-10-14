const { fail } = require("../utils/apiResponse");
const Equipment = require("../models/Equipment");

const validateEquipment = (req, res, next) => {
  const { facility, category, type, name, status, inspectionIntervalDays, dueWindowDays } = req.body;
  const errors = [];

  if (!facility) errors.push("facility is required.");
  if (!category || !Equipment.CATEGORIES.includes(category)) {
    errors.push(`category must be one of: ${Equipment.CATEGORIES.join(", ")}`);
  }
  if (!type || !Equipment.TYPES.includes(type)) {
    errors.push(`type must be one of: ${Equipment.TYPES.join(", ")}`);
  }
  if (!name || !name.trim()) errors.push("name is required.");
  if (status && !Equipment.STATUSES.includes(status)) {
    errors.push(`status must be one of: ${Equipment.STATUSES.join(", ")}`);
  }
  if (inspectionIntervalDays !== undefined && inspectionIntervalDays !== null && isNaN(inspectionIntervalDays)) {
    errors.push("inspectionIntervalDays must be a number.");
  }
  if (dueWindowDays !== undefined && dueWindowDays !== null && isNaN(dueWindowDays)) {
    errors.push("dueWindowDays must be a number.");
  }

  if (errors.length) return fail(res, 400, "Validation failed.", errors);
  next();
};

module.exports = { validateEquipment };
