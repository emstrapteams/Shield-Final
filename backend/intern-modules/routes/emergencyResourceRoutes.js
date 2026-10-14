const express = require("express");
const { validateEmergencyResource } = require("../validation/emergencyResourceValidation");
const {
  createEmergencyResource, getEmergencyResources, getEmergencyResourceById,
  updateEmergencyResource, setEmergencyResourceStatus,
} = require("../controllers/emergencyResourceController");

const router = express.Router();
// NOTE: configuration/management only. No auth/RBAC/company-isolation and
// no emergency-triggering/workflow logic here (developed separately).

router.get("/", getEmergencyResources);
router.post("/", validateEmergencyResource, createEmergencyResource);
router.get("/:id", getEmergencyResourceById);
router.put("/:id", validateEmergencyResource, updateEmergencyResource);
router.patch("/:id/status", setEmergencyResourceStatus);

module.exports = router;
