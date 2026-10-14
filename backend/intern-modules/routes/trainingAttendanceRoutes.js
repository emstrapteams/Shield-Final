const express = require("express");
const { getAttendance, setAttendanceStatus, addCertificates } = require("../controllers/trainingAttendanceController");

const router = express.Router();

router.get("/", getAttendance);
router.patch("/:id/status", setAttendanceStatus);
router.patch("/:id/certificates", addCertificates);

module.exports = router;
