const express = require("express");
const { validateFacility } = require("../validation/facilityValidation");
const {
  createFacility,
  getFacilities,
  getFacilityById,
  updateFacility,
  setFacilityStatus,
} = require("../controllers/facilityController");

const router = express.Router();

router.get("/", getFacilities);
router.post("/", validateFacility, createFacility);
router.get("/:id", getFacilityById);
router.put("/:id", validateFacility, updateFacility);
router.patch("/:id/status", setFacilityStatus);

module.exports = router;
