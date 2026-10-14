const Facility = require("../models/Facility");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, fail } = require("../utils/apiResponse");

const scopedFilter = (req, extra = {}) => {
  if (!req.companyId) return { _blockAll: true };
  return { company: req.companyId, ...extra };
};

// POST /api/facilities
const createFacility = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required to create a facility.");
  const facility = await Facility.create({ ...req.body, company: req.companyId });
  return created(res, facility);
});

// GET /api/facilities?search=&city=&status=&page=&limit=
const getFacilities = asyncHandler(async (req, res) => {
  const { search, city, status, page = 1, limit = 20 } = req.query;

  const filter = scopedFilter(req);
  if (status) filter.status = status;
  if (city) filter.city = { $regex: city, $options: "i" };
  if (search) filter.name = { $regex: search, $options: "i" };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [items, total] = await Promise.all([
    Facility.find(filter).sort({ name: 1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Facility.countDocuments(filter),
  ]);

  return ok(res, items, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
  });
});

// GET /api/facilities/:id
const getFacilityById = asyncHandler(async (req, res) => {
  const facility = await Facility.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!facility) return fail(res, 404, "Facility not found.");
  return ok(res, facility);
});

// PUT /api/facilities/:id
const updateFacility = asyncHandler(async (req, res) => {
  const facility = await Facility.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!facility) return fail(res, 404, "Facility not found.");

  const { company, ...rest } = req.body;
  Object.assign(facility, rest);
  await facility.save();

  return ok(res, facility);
});

// PATCH /api/facilities/:id/status
const setFacilityStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["active", "inactive"].includes(status)) {
    return fail(res, 400, "status must be 'active' or 'inactive'.");
  }

  const facility = await Facility.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!facility) return fail(res, 404, "Facility not found.");

  facility.status = status;
  await facility.save();

  return ok(res, facility);
});

module.exports = {
  createFacility,
  getFacilities,
  getFacilityById,
  updateFacility,
  setFacilityStatus,
};
