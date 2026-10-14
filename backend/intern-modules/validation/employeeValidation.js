const { fail } = require("../utils/apiResponse");

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;

const validateEmployee = (req, res, next) => {
  const { employeeId, name, email, phone, joiningDate, status } = req.body;
  const errors = [];

  if (!employeeId || !employeeId.trim()) errors.push("employeeId is required.");
  if (!name || !name.trim()) errors.push("name is required.");
  if (!email || !EMAIL_RE.test(email)) errors.push("A valid email is required.");
  if (!phone || !PHONE_RE.test(phone)) errors.push("A valid phone number is required.");
  if (joiningDate && isNaN(Date.parse(joiningDate))) errors.push("joiningDate is not a valid date.");
  if (status && !["active", "inactive"].includes(status)) errors.push("status must be active or inactive.");

  if (errors.length) return fail(res, 400, "Validation failed.", errors);
  next();
};

module.exports = { validateEmployee };
