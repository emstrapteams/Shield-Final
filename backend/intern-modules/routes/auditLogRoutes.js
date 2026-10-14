const express = require("express");
const { getAuditLogs, getAuditLogById } = require("../controllers/auditLogController");

const router = express.Router();
// NOTE: no authentication/authorization here — deciding who may view audit
// logs is part of the separately developed security layer.

router.get("/", getAuditLogs);
router.get("/:id", getAuditLogById);

module.exports = router;
