const express = require("express");
const { getStats } = require("../controllers/trainingDashboardController");

const router = express.Router();

router.get("/stats", getStats);

module.exports = router;
