const Equipment = require("../models/Equipment");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, fail } = require("../utils/apiResponse");

// First-Aid Kits are Equipment documents with type='first_aid_kit'.
const TYPE = "first_aid_kit";

const scopedFilter = (req, extra = {}) => {
  if (!req.companyId) return { _blockAll: true };
  return { company: req.companyId, type: TYPE, ...extra };
};

// POST /api/first-aid-kits
const createFirstAidKit = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const payload = {
    ...req.body,
    company: req.companyId,
    type: TYPE,
    category: "medical",
  };
  const equipment = await Equipment.create(payload);
  return created(res, equipment);
});

// GET /api/first-aid-kits?search=&facility=&status=&contentsStatus=&page=&limit=
const getFirstAidKits = asyncHandler(async (req, res) => {
  const { search, facility, status, contentsStatus, page = 1, limit = 20 } = req.query;

  const filter = scopedFilter(req);
  if (facility) filter.facility = facility;
  if (status) filter.status = status;
  if (contentsStatus) filter["firstAidKit.contentsStatus"] = contentsStatus;
  if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }];

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [items, total] = await Promise.all([
    Equipment.find(filter).populate("facility", "name city").sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Equipment.countDocuments(filter),
  ]);

  return ok(res, items, { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 });
});

// GET /api/first-aid-kits/:id
const getFirstAidKitById = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findOne(scopedFilter(req, { _id: req.params.id })).populate("facility", "name city");
  if (!equipment) return fail(res, 404, "First-aid kit not found.");
  return ok(res, equipment);
});

// PUT /api/first-aid-kits/:id
const updateFirstAidKit = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!equipment) return fail(res, 404, "First-aid kit not found.");

  const { company, type, category, ...rest } = req.body;
  Object.assign(equipment, rest);
  await equipment.save();
  return ok(res, equipment);
});

// PATCH /api/first-aid-kits/:id/status
const setFirstAidKitStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!Equipment.STATUSES.includes(status)) {
    return fail(res, 400, `status must be one of: ${Equipment.STATUSES.join(", ")}`);
  }
  const equipment = await Equipment.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!equipment) return fail(res, 404, "First-aid kit not found.");
  equipment.status = status;
  await equipment.save();
  return ok(res, equipment);
});

// PATCH /api/first-aid-kits/:id/contents
// Dedicated endpoint for updating contents/refill status without touching
// the rest of the equipment record.
const updateFirstAidKitContents = asyncHandler(async (req, res) => {
  const { contentsStatus, refillRequired, expiryItems } = req.body;
  const equipment = await Equipment.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!equipment) return fail(res, 404, "First-aid kit not found.");

  if (contentsStatus) equipment.firstAidKit.contentsStatus = contentsStatus;
  if (refillRequired !== undefined) equipment.firstAidKit.refillRequired = refillRequired;
  if (Array.isArray(expiryItems)) equipment.firstAidKit.expiryItems = expiryItems;

  await equipment.save();
  return ok(res, equipment);
});

module.exports = {
  createFirstAidKit,
  getFirstAidKits,
  getFirstAidKitById,
  updateFirstAidKit,
  setFirstAidKitStatus,
  updateFirstAidKitContents,
};
