const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/apiResponse");
const { parsePagination, pageMeta } = require("../utils/scope");

// GET /api/audit-logs?company=&actorName=&action=&resourceType=&resourceId=&from=&to=&page=&limit=
// Viewing/searching/filtering logs — WHO is allowed to call this endpoint
// is decided by the separately developed auth/authorization layer, not
// implemented here.
const getAuditLogs = asyncHandler(async (req, res) => {
  const { company, actorName, action, resourceType, resourceId, from, to } = req.query;
  const filter = {};
  if (company) filter.company = company;
  if (actorName) filter.actorName = { $regex: actorName, $options: "i" };
  if (action) filter.action = action;
  if (resourceType) filter.resourceType = resourceType;
  if (resourceId) filter.resourceId = resourceId;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const { pageNum, limitNum, skip } = parsePagination(req.query, 50);
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    AuditLog.countDocuments(filter),
  ]);
  return ok(res, items, pageMeta(pageNum, limitNum, total));
});

// GET /api/audit-logs/:id
const getAuditLogById = asyncHandler(async (req, res) => {
  const log = await AuditLog.findById(req.params.id);
  if (!log) return fail(res, 404, "Audit log entry not found.");
  return ok(res, log);
});

module.exports = { getAuditLogs, getAuditLogById };
