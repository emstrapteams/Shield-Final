const EmergencyResource = require("../models/EmergencyResource");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, fail } = require("../utils/apiResponse");
const { scopedFilter, parsePagination, pageMeta } = require("../utils/scope");

// CONFIGURATION/MANAGEMENT ONLY. No emergency triggering, categorization,
// workflow, resource selection during an active emergency, request
// sending, live tracking, or external-service integration lives here or
// anywhere in this module — that engine is developed separately.

// POST /api/emergency-resources
const createEmergencyResource = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const resource = await EmergencyResource.create({ ...req.body, company: req.companyId });
  return created(res, resource);
});

// GET /api/emergency-resources?search=&category=&serviceType=&status=&page=&limit=
const getEmergencyResources = asyncHandler(async (req, res) => {
  const { search, category, serviceType, status, page, limit } = req.query;
  const filter = scopedFilter(req);
  if (category) filter.category = category;
  if (serviceType) filter.serviceType = serviceType;
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: "i" };

  const { pageNum, limitNum, skip } = parsePagination(req.query);
  const [items, total] = await Promise.all([
    EmergencyResource.find(filter).sort({ priority: 1, name: 1 }).skip(skip).limit(limitNum),
    EmergencyResource.countDocuments(filter),
  ]);
  return ok(res, items, pageMeta(pageNum, limitNum, total));
});

// GET /api/emergency-resources/:id
const getEmergencyResourceById = asyncHandler(async (req, res) => {
  const resource = await EmergencyResource.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!resource) return fail(res, 404, "Emergency resource not found.");
  return ok(res, resource);
});

// PUT /api/emergency-resources/:id
const updateEmergencyResource = asyncHandler(async (req, res) => {
  const resource = await EmergencyResource.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!resource) return fail(res, 404, "Emergency resource not found.");
  const { company, ...rest } = req.body;
  Object.assign(resource, rest);
  await resource.save();
  return ok(res, resource);
});

// PATCH /api/emergency-resources/:id/status
const setEmergencyResourceStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["active", "inactive"].includes(status)) return fail(res, 400, "status must be active or inactive.");
  const resource = await EmergencyResource.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!resource) return fail(res, 404, "Emergency resource not found.");
  resource.status = status;
  await resource.save();
  return ok(res, resource);
});

module.exports = {
  createEmergencyResource,
  getEmergencyResources,
  getEmergencyResourceById,
  updateEmergencyResource,
  setEmergencyResourceStatus,
};
