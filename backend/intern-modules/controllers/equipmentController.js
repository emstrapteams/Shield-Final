const Equipment = require("../models/Equipment");
const Inspection = require("../models/Inspection");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, fail } = require("../utils/apiResponse");

const scopedFilter = (req, extra = {}) => {
  if (!req.companyId) return { _blockAll: true };
  return { company: req.companyId, ...extra };
};

// POST /api/equipment
const createEquipment = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required to create equipment.");
  const equipment = await Equipment.create({ ...req.body, company: req.companyId });
  return created(res, equipment);
});

// GET /api/equipment?search=&facility=&category=&type=&status=&page=&limit=
const getEquipmentList = asyncHandler(async (req, res) => {
  const { search, facility, category, type, status, page = 1, limit = 20 } = req.query;

  const filter = scopedFilter(req);
  if (facility) filter.facility = facility;
  if (category) filter.category = category;
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [items, total] = await Promise.all([
    Equipment.find(filter)
      .populate("facility", "name city")
      .populate("responsiblePerson", "name employeeId")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Equipment.countDocuments(filter),
  ]);

  return ok(res, items, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
  });
});

// GET /api/equipment/:id
const getEquipmentById = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findOne(scopedFilter(req, { _id: req.params.id }))
    .populate("facility", "name city")
    .populate("responsiblePerson", "name employeeId");

  if (!equipment) return fail(res, 404, "Equipment not found.");
  return ok(res, equipment);
});

// PUT /api/equipment/:id
const updateEquipment = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!equipment) return fail(res, 404, "Equipment not found.");

  const { company, ...rest } = req.body;
  Object.assign(equipment, rest);
  await equipment.save(); // re-runs status auto-derivation
  return ok(res, equipment);
});

// PATCH /api/equipment/:id/status
const setEquipmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!Equipment.STATUSES.includes(status)) {
    return fail(res, 400, `status must be one of: ${Equipment.STATUSES.join(", ")}`);
  }

  const equipment = await Equipment.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!equipment) return fail(res, 404, "Equipment not found.");

  equipment.status = status;
  await equipment.save();
  return ok(res, equipment);
});

// GET /api/equipment/:id/inspections
const getEquipmentInspectionHistory = asyncHandler(async (req, res) => {
  const equipment = await Equipment.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!equipment) return fail(res, 404, "Equipment not found.");

  const inspections = await Inspection.find({ company: req.companyId, equipment: equipment._id })
    .populate("inspector", "name employeeId")
    .sort({ inspectionDate: -1 });

  return ok(res, inspections);
});

module.exports = {
  createEquipment,
  getEquipmentList,
  getEquipmentById,
  updateEquipment,
  setEquipmentStatus,
  getEquipmentInspectionHistory,
  scopedFilter,
};
