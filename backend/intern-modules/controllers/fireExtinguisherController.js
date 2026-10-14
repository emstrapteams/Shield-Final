const Equipment = require("../models/Equipment");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, fail } = require("../utils/apiResponse");

// Fire Extinguishers are Equipment documents with type='fire_extinguisher'.
// This controller is a dedicated, type-scoped view with its own tracking
// summary, not a separate collection.
const TYPE = "fire_extinguisher";

const scopedFilter = (req, extra = {}) => {
  if (!req.companyId) return { _blockAll: true };
  return { company: req.companyId, type: TYPE, ...extra };
};

// POST /api/fire-extinguishers
const createFireExtinguisher = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const payload = {
    ...req.body,
    company: req.companyId,
    type: TYPE,
    category: "fire_safety",
  };
  const equipment = await Equipment.create(payload);
  return created(res, equipment);
});

// GET /api/fire-extinguishers?search=&facility=&status=&page=&limit=
const getFireExtinguishers = asyncHandler(async (req, res) => {
  const { search, facility, status, page = 1, limit = 20 } = req.query;

  const filter = scopedFilter(req);
  if (facility) filter.facility = facility;
  if (status) filter.status = status;
  if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }];

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [items, total] = await Promise.all([
    Equipment.find(filter).populate("facility", "name city").sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Equipment.countDocuments(filter),
  ]);

  return ok(res, items, { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 });
});

// GET /api/fire-extinguishers/summary
// Counts by tracking bucket: active, inspection_due, overdue,
// replacement_required, inactive.
const getFireExtinguisherSummary = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");

  const rows = await Equipment.aggregate([
    { $match: { company: new (require("mongoose").Types.ObjectId)(req.companyId), type: TYPE } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const summary = { active: 0, inspection_due: 0, overdue: 0, replacement_required: 0, inactive: 0 };
  rows.forEach((r) => { summary[r._id] = r.count; });

  return ok(res, summary);
});

// GET /api/fire-extinguishers/:id
const getFireExtinguisherById = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findOne(scopedFilter(req, { _id: req.params.id })).populate("facility", "name city");
  if (!equipment) return fail(res, 404, "Fire extinguisher not found.");
  return ok(res, equipment);
});

// PUT /api/fire-extinguishers/:id
const updateFireExtinguisher = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!equipment) return fail(res, 404, "Fire extinguisher not found.");

  const { company, type, category, ...rest } = req.body; // type/category locked
  Object.assign(equipment, rest);
  await equipment.save();
  return ok(res, equipment);
});

// PATCH /api/fire-extinguishers/:id/status
const setFireExtinguisherStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!Equipment.STATUSES.includes(status)) {
    return fail(res, 400, `status must be one of: ${Equipment.STATUSES.join(", ")}`);
  }
  const equipment = await Equipment.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!equipment) return fail(res, 404, "Fire extinguisher not found.");
  equipment.status = status;
  await equipment.save();
  return ok(res, equipment);
});

module.exports = {
  createFireExtinguisher,
  getFireExtinguishers,
  getFireExtinguisherSummary,
  getFireExtinguisherById,
  updateFireExtinguisher,
  setFireExtinguisherStatus,
};
