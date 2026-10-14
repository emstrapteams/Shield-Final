const { fail } = require("../utils/apiResponse");

const validateFacility = (req, res, next) => {
  const { name, latitude, longitude, status } = req.body;
  const errors = [];

  if (!name || !name.trim()) errors.push("name is required.");
  if (latitude !== undefined && latitude !== null && latitude !== "" && (isNaN(latitude) || latitude < -90 || latitude > 90)) {
    errors.push("latitude must be a number between -90 and 90.");
  }
  if (longitude !== undefined && longitude !== null && longitude !== "" && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
    errors.push("longitude must be a number between -180 and 180.");
  }
  if (status && !["active", "inactive"].includes(status)) errors.push("status must be active or inactive.");

  if (errors.length) return fail(res, 400, "Validation failed.", errors);
  next();
};

module.exports = { validateFacility };
