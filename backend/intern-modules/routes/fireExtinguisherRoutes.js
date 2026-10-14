
const express = require("express");

const {
  createFireExtinguisher,
  getFireExtinguishers,
  getFireExtinguisherSummary,
  getFireExtinguisherById,
  updateFireExtinguisher,
  setFireExtinguisherStatus,
} = require("../controllers/fireExtinguisherController");

const router = express.Router();

router.get("/", getFireExtinguishers);
router.get("/summary", getFireExtinguisherSummary);
router.post("/", createFireExtinguisher);
router.get("/:id", getFireExtinguisherById);
router.put("/:id", updateFireExtinguisher);
router.patch("/:id/status", setFireExtinguisherStatus);

module.exports = router;
