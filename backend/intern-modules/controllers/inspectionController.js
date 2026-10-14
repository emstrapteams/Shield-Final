const Inspection = require("../models/Inspection");
const Equipment = require("../models/Equipment");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, fail } = require("../utils/apiResponse");

const scopedFilter = (req, extra = {}) => {
  if (!req.companyId) return { _blockAll: true };
  return { company: req.companyId, ...extra };
};

// POST /api/inspections
// Creates the inspection AND rolls the result forward onto the equipment
// record (lastInspectionDate / nextInspectionDate / status), since an
// inspection is meaningless if it doesn't update the thing it inspected.
const createInspection = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");

  const equipment = await Equipment.findOne({ _id: req.body.equipment, company: req.companyId });
  if (!equipment) return fail(res, 404, "Equipment not found for this company.");

  const inspection = await Inspection.create({ ...req.body, company: req.companyId });

  equipment.lastInspectionDate = inspection.inspectionDate;
  if (inspection.nextInspectionDate) equipment.nextInspectionDate = inspection.nextInspectionDate;

  if (inspection.result === "failed") {
    equipment.status = "replacement_required";
  } else if (equipment.status !== "inactive") {
    // Let the equipment's own pre-save hook recompute active/due/overdue
    // from the refreshed dates.
    equipment.status = "active";
  }
  await equipment.save();

  return created(res, inspection);
});

// GET /api/inspections?search=&equipment=&facility=&inspector=&result=&from=&to=&page=&limit=
const getInspections = asyncHandler(async (req, res) => {
  const { equipment, facility, inspector, result, from, to, page = 1, limit = 20 } = req.query;

  const filter = scopedFilter(req);
  if (equipment) filter.equipment = equipment;
  if (inspector) filter.inspector = inspector;
  if (result) filter.result = result;
  if (from || to) {
    filter.inspectionDate = {};
    if (from) filter.inspectionDate.$gte = new Date(from);
    if (to) filter.inspectionDate.$lte = new Date(to);
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  let query = Inspection.find(filter)
    .populate({ path: "equipment", select: "name type facility", populate: { path: "facility", select: "name" } })
    .populate("inspector", "name employeeId");

  // Facility filter requires filtering on the populated equipment's
  // facility; simplest correct approach is a two-step lookup.
  if (facility) {
    const equipmentIds = await require("../models/Equipment").find({ company: req.companyId, facility }).distinct("_id");
    filter.equipment = { $in: equipmentIds };
    query = Inspection.find(filter)
      .populate({ path: "equipment", select: "name type facility", populate: { path: "facility", select: "name" } })
      .populate("inspector", "name employeeId");
  }

  const [items, total] = await Promise.all([
    query.sort({ inspectionDate: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Inspection.countDocuments(filter),
  ]);

  return ok(res, items, { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 });
});

// GET /api/inspections/:id
const getInspectionById = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findOne(scopedFilter(req, { _id: req.params.id }))
    .populate("equipment", "name type facility")
    .populate("inspector", "name employeeId");
  if (!inspection) return fail(res, 404, "Inspection not found.");
  return ok(res, inspection);
});

// PUT /api/inspections/:id
const updateInspection = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!inspection) return fail(res, 404, "Inspection not found.");

  const { company, equipment, ...rest } = req.body; // equipment link immutable after creation
  Object.assign(inspection, rest);
  await inspection.save(); // re-derives result
  return ok(res, inspection);
});

module.exports = { createInspection, getInspections, getInspectionById, updateInspection };
