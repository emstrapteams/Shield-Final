const express = require("express");
const { validateTrainingSession } = require("../validation/trainingValidation");
const {
  createSession, getSessions, getSessionById, updateSession, assignEmployees, getSessionAttendance,
} = require("../controllers/trainingSessionController");

const router = express.Router();

router.get("/", getSessions);
router.post("/", validateTrainingSession, createSession);
router.get("/:id", getSessionById);
router.put("/:id", validateTrainingSession, updateSession);
router.post("/:id/assign", assignEmployees);
router.get("/:id/attendance", getSessionAttendance);

module.exports = router;
