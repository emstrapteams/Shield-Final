const { fail } = require("../utils/apiResponse");
const EmergencyResource = require("../models/EmergencyResource");

const validateEmergencyResource = (req, res, next) => {
  const { category, serviceType, name, priority, integrationStatus, status } = req.body;
  const errors = [];

  if (!category || !EmergencyResource.CATEGORIES.includes(category)) {
    errors.push(`category must be one of: ${EmergencyResource.CATEGORIES.join(", ")}`);
  }
  const allTypes = [...EmergencyResource.INTERNAL_TYPES, ...EmergencyResource.EXTERNAL_TYPES];
  if (!serviceType || !allTypes.includes(serviceType)) {
    errors.push(`serviceType must be one of: ${allTypes.join(", ")}`);
  }
  if (category === "internal" && serviceType && !EmergencyResource.INTERNAL_TYPES.includes(serviceType)) {
    errors.push("serviceType does not match category 'internal'.");
  }
  if (category === "external" && serviceType && !EmergencyResource.EXTERNAL_TYPES.includes(serviceType)) {
    errors.push("serviceType does not match category 'external'.");
  }
  if (!name || !name.trim()) errors.push("name is required.");
  if (priority !== undefined && (isNaN(priority) || priority < 1 || priority > 5)) {
    errors.push("priority must be a number between 1 and 5.");
  }
  if (integrationStatus && !EmergencyResource.INTEGRATION_STATUSES.includes(integrationStatus)) {
    errors.push(`integrationStatus must be one of: ${EmergencyResource.INTEGRATION_STATUSES.join(", ")}`);
  }
  if (status && !["active", "inactive"].includes(status)) errors.push("status must be active or inactive.");

  if (errors.length) return fail(res, 400, "Validation failed.", errors);
  next();
};

module.exports = { validateEmergencyResource };
