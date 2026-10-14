const Drill = require("../models/Drill");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, fail } = require("../utils/apiResponse");
const { scopedFilter, parsePagination, pageMeta } = require("../utils/scope");

const createDrill = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const drill = await Drill.create({ ...req.body, company: req.companyId });
  return created(res, drill);
});

const getDrills = asyncHandler(async (req, res) => {
  const { search, facility, type, status, from, to } = req.query;
  const filter = scopedFilter(req);
  if (facility) filter.facility = facility;
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: "i" };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const { pageNum, limitNum, skip } = parsePagination(req.query);
  const [items, total] = await Promise.all([
    Drill.find(filter).populate("facility", "name").sort({ date: -1 }).skip(skip).limit(limitNum),
    Drill.countDocuments(filter),
  ]);
  return ok(res, items, pageMeta(pageNum, limitNum, total));
});

const getDrillById = asyncHandler(async (req, res) => {
  const drill = await Drill.findOne(scopedFilter(req, { _id: req.params.id }))
    .populate("facility", "name")
    .populate("participants.employee", "name employeeId")
    .populate("correctiveActions", "title status priority");
  if (!drill) return fail(res, 404, "Drill not found.");
  return ok(res, drill);
});

const updateDrill = asyncHandler(async (req, res) => {
  const drill = await Drill.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!drill) return fail(res, 404, "Drill not found.");
  const { company, ...rest } = req.body;
  Object.assign(drill, rest);
  await drill.save();
  return ok(res, drill);
});

// PATCH /api/drills/:id/participants  { employeeIds: [...] }  -- sets the full participant list
const setParticipants = asyncHandler(async (req, res) => {
  const { employeeIds } = req.body;
  if (!Array.isArray(employeeIds)) return fail(res, 400, "employeeIds must be an array.");
  const drill = await Drill.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!drill) return fail(res, 404, "Drill not found.");

  const existingByEmployee = new Map(drill.participants.map((p) => [p.employee.toString(), p]));
  drill.participants = employeeIds.map((id) => existingByEmployee.get(id) || { employee: id, attended: false, notes: "" });
  await drill.save();
  return ok(res, drill);
});

// PATCH /api/drills/:id/attendance  { employeeId, attended, notes? }
const recordAttendance = asyncHandler(async (req, res) => {
  const { employeeId, attended, notes } = req.body;
  const drill = await Drill.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!drill) return fail(res, 404, "Drill not found.");

  const participant = drill.participants.find((p) => p.employee.toString() === employeeId);
  if (!participant) return fail(res, 404, "Employee is not a participant in this drill.");

  if (attended !== undefined) participant.attended = attended;
  if (notes !== undefined) participant.notes = notes;
  await drill.save();
  return ok(res, drill);
});

// PATCH /api/drills/:id/results  { status?, completionTimeMinutes? }
const recordResults = asyncHandler(async (req, res) => {
  const { status, completionTimeMinutes } = req.body;
  const drill = await Drill.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!drill) return fail(res, 404, "Drill not found.");

  if (status) {
    if (!Drill.STATUSES.includes(status)) return fail(res, 400, `status must be one of: ${Drill.STATUSES.join(", ")}`);
    drill.status = status;
  }
  if (completionTimeMinutes !== undefined) drill.completionTimeMinutes = completionTimeMinutes;
  await drill.save();
  return ok(res, drill);
});

// POST /api/drills/:id/observations  { text }
const addObservation = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return fail(res, 400, "text is required.");
  const drill = await Drill.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!drill) return fail(res, 404, "Drill not found.");
  drill.observations.push({ text });
  await drill.save();
  return ok(res, drill);
});

// POST /api/drills/:id/issues  { description, severity? }
const addIssue = asyncHandler(async (req, res) => {
  const { description, severity } = req.body;
  if (!description || !description.trim()) return fail(res, 400, "description is required.");
  const drill = await Drill.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!drill) return fail(res, 404, "Drill not found.");
  drill.issues.push({ description, severity: severity || "medium" });
  await drill.save();
  return ok(res, drill);
});

// PATCH /api/drills/:id/corrective-actions  { correctiveActionId }
const linkCorrectiveAction = asyncHandler(async (req, res) => {
  const { correctiveActionId } = req.body;
  if (!correctiveActionId) return fail(res, 400, "correctiveActionId is required.");
  const drill = await Drill.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!drill) return fail(res, 404, "Drill not found.");
  if (!drill.correctiveActions.map(String).includes(correctiveActionId)) {
    drill.correctiveActions.push(correctiveActionId);
    await drill.save();
  }
  return ok(res, drill);
});

module.exports = {
  createDrill, getDrills, getDrillById, updateDrill,
  setParticipants, recordAttendance, recordResults, addObservation, addIssue, linkCorrectiveAction,
};
