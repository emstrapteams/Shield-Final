const express = require("express");
const { validateTrainingProgram } = require("../validation/trainingValidation");
const {
  createProgram, getPrograms, getProgramById, updateProgram, setProgramStatus,
} = require("../controllers/trainingProgramController");

const router = express.Router();

router.get("/", getPrograms);
router.post("/", validateTrainingProgram, createProgram);
router.get("/:id", getProgramById);
router.put("/:id", validateTrainingProgram, updateProgram);
router.patch("/:id/status", setProgramStatus);

module.exports = router;
