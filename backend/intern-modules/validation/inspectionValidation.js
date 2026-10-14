const { fail } = require("../utils/apiResponse");
const Inspection = require("../models/Inspection");

const validateInspection = (req, res, next) => {
  const { equipment, inspectionDate, checklist } = req.body;
  const errors = [];

  if (!equipment) errors.push("equipment is required.");
  if (inspectionDate && isNaN(Date.parse(inspectionDate))) errors.push("inspectionDate is not a valid date.");

  if (!Array.isArray(checklist) || checklist.length === 0) {
    errors.push("checklist must be a non-empty array of { item, result, notes? }.");
  } else {
    checklist.forEach((c, i) => {
      if (!c.item || !c.item.trim()) errors.push(`checklist[${i}].item is required.`);
      if (!c.result || !Inspection.ITEM_RESULTS.includes(c.result)) {
        errors.push(`checklist[${i}].result must be one of: ${Inspection.ITEM_RESULTS.join(", ")}`);
      }
    });
  }

  if (errors.length) return fail(res, 400, "Validation failed.", errors);
  next();
};

module.exports = { validateInspection };
