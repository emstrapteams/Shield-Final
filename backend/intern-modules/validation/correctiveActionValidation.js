const { fail } = require("../utils/apiResponse");
const CorrectiveAction = require("../models/CorrectiveAction");

const validateCorrectiveAction = (req, res, next) => {
  const { sourceType, title, priority, status, dueDate } = req.body;
  const errors = [];

  if (!sourceType || !CorrectiveAction.SOURCE_TYPES.includes(sourceType)) {
    errors.push(`sourceType must be one of: ${CorrectiveAction.SOURCE_TYPES.join(", ")}`);
  }
  if (!title || !title.trim()) errors.push("title is required.");
  if (priority && !CorrectiveAction.PRIORITIES.includes(priority)) {
    errors.push(`priority must be one of: ${CorrectiveAction.PRIORITIES.join(", ")}`);
  }
  if (status && !CorrectiveAction.STATUSES.includes(status)) {
    errors.push(`status must be one of: ${CorrectiveAction.STATUSES.join(", ")}`);
  }
  if (dueDate && isNaN(Date.parse(dueDate))) errors.push("dueDate is not a valid date.");

  if (errors.length) return fail(res, 400, "Validation failed.", errors);
  next();
};

module.exports = { validateCorrectiveAction };
