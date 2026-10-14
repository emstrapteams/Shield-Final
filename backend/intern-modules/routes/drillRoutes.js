const express = require("express");
const { validateDrill } = require("../validation/drillValidation");
const {
  createDrill, getDrills, getDrillById, updateDrill,
  setParticipants, recordAttendance, recordResults, addObservation, addIssue, linkCorrectiveAction,
} = require("../controllers/drillController");

const router = express.Router();

router.get("/", getDrills);
router.post("/", validateDrill, createDrill);
router.get("/:id", getDrillById);
router.put("/:id", validateDrill, updateDrill);
router.patch("/:id/participants", setParticipants);
router.patch("/:id/attendance", recordAttendance);
router.patch("/:id/results", recordResults);
router.post("/:id/observations", addObservation);
router.post("/:id/issues", addIssue);
router.patch("/:id/corrective-actions", linkCorrectiveAction);

module.exports = router;
