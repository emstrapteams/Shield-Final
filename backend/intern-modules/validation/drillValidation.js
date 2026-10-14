const { fail } = require("../utils/apiResponse");
const Drill = require("../models/Drill");

const validateDrill = (req, res, next) => {
  const { facility, name, type, date, status } = req.body;
  const errors = [];

  if (!facility) errors.push("facility is required.");
  if (!name || !name.trim()) errors.push("name is required.");
  if (!type || !Drill.TYPES.includes(type)) errors.push(`type must be one of: ${Drill.TYPES.join(", ")}`);
  if (!date || isNaN(Date.parse(date))) errors.push("date must be a valid date.");
  if (status && !Drill.STATUSES.includes(status)) errors.push(`status must be one of: ${Drill.STATUSES.join(", ")}`);

  if (errors.length) return fail(res, 400, "Validation failed.", errors);
  next();
};

module.exports = { validateDrill };
