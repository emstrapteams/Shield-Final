const express = require("express");
const { validateEquipment } = require("../validation/equipmentValidation");
const {
  createEquipment,
  getEquipmentList,
  getEquipmentById,
  updateEquipment,
  setEquipmentStatus,
  getEquipmentInspectionHistory,
} = require("../controllers/equipmentController");

const router = express.Router();

// NOTE: Authentication, RBAC, and company isolation are handled separately
// in the main Shield architecture. setCompanyContext is a temporary
// placeholder only (see backend/middleware/companyContext.js).

router.get("/", getEquipmentList);
router.post("/", validateEquipment, createEquipment);
router.get("/:id", getEquipmentById);
router.put("/:id", validateEquipment, updateEquipment);
router.patch("/:id/status", setEquipmentStatus);
router.get("/:id/inspections", getEquipmentInspectionHistory);

module.exports = router;
