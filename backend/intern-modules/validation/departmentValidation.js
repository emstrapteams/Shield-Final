const { fail } = require("../utils/apiResponse");

const validateDepartment = (req, res, next) => {
  const { name, status } = req.body;
  const errors = [];

  if (!name || !name.trim()) errors.push("name is required.");
  if (status && !["active", "inactive"].includes(status)) errors.push("status must be active or inactive.");

  if (errors.length) return fail(res, 400, "Validation failed.", errors);
  next();
};

module.exports = { validateDepartment };
