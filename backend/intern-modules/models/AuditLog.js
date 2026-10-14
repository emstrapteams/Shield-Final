const mongoose = require("mongoose");

/**
 * Audit log data structure for recording business/admin actions.
 *
 * This module records WHAT happened; it deliberately does NOT implement
 * the authentication/authorization layer that decides WHO is allowed to
 * perform an action — that is developed separately. Actor fields below are
 * therefore free-text/optional, sourced from request headers as a
 * temporary convenience (see utils/audit.js), not from a real session.
 */
const auditLogSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null, index: true }, // null for platform-level actions (e.g. company creation)
    actorName: { type: String, trim: true, default: "unknown" },
    actorRole: { type: String, trim: true, default: "" },
    action: { type: String, required: true, trim: true, index: true }, // e.g. "employee_created"
    resourceType: { type: String, required: true, trim: true, index: true }, // e.g. "Employee"
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
