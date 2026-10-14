const { fail } = require("../utils/apiResponse");

const validateCompany = (req, res, next) => {
  const { name, code, status } = req.body;
  const errors = [];

  if (!name || !name.trim()) errors.push("name is required.");
  if (!code || !code.trim()) errors.push("code is required.");
  if (status && !["active", "suspended", "deactivated"].includes(status)) {
    errors.push("status must be one of: active, suspended, deactivated");
  }

  if (errors.length) return fail(res, 400, "Validation failed.", errors);
  next();
};

module.exports = { validateCompany };
