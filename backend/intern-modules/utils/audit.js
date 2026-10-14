const AuditLog = require("../models/AuditLog");

/**
 * Records an audit log entry. This is intentionally simple and
 * fire-and-forget (errors are swallowed after logging to console) so that
 * audit recording never breaks the primary request it's attached to.
 *
 * Actor identity is read from temporary, non-authenticating request
 * headers (x-actor-name, x-actor-role) — the same placeholder pattern as
 * companyContext.js — since real actor identity depends on the
 * authentication layer developed separately.
 */
async function recordAudit(req, { action, resourceType, resourceId = null, metadata = {} }) {
  try {
    await AuditLog.create({
      company: req.companyId || null,
      actorName: req.headers["x-actor-name"] || "unknown",
      actorRole: req.headers["x-actor-role"] || "",
      action,
      resourceType,
      resourceId,
      metadata,
    });
  } catch (err) {
    console.error("[audit] failed to record entry:", err.message);
  }
}

module.exports = { recordAudit };
