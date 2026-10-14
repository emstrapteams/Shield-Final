const TrainingSession = require("../models/TrainingSession");
const TrainingAttendance = require("../models/TrainingAttendance");
const Employee = require("../models/Employee");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, fail } = require("../utils/apiResponse");
const { scopedFilter, parsePagination, pageMeta } = require("../utils/scope");

const createSession = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const session = await TrainingSession.create({ ...req.body, company: req.companyId });
  return created(res, session);
});

const getSessions = asyncHandler(async (req, res) => {
  const { program, facility, status, from, to } = req.query;
  const filter = scopedFilter(req);
  if (program) filter.program = program;
  if (facility) filter.facility = facility;
  if (status) filter.status = status;
  if (from || to) {
    filter.scheduledDate = {};
    if (from) filter.scheduledDate.$gte = new Date(from);
    if (to) filter.scheduledDate.$lte = new Date(to);
  }

  const { pageNum, limitNum, skip } = parsePagination(req.query);
  const [items, total] = await Promise.all([
    TrainingSession.find(filter)
      .populate("program", "name type")
      .populate("facility", "name")
      .sort({ scheduledDate: -1 })
      .skip(skip).limit(limitNum),
    TrainingSession.countDocuments(filter),
  ]);
  return ok(res, items, pageMeta(pageNum, limitNum, total));
});

const getSessionById = asyncHandler(async (req, res) => {
  const session = await TrainingSession.findOne(scopedFilter(req, { _id: req.params.id }))
    .populate("program", "name type")
    .populate("facility", "name");
  if (!session) return fail(res, 404, "Training session not found.");
  return ok(res, session);
});

const updateSession = asyncHandler(async (req, res) => {
  const session = await TrainingSession.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!session) return fail(res, 404, "Training session not found.");
  const { company, ...rest } = req.body;
  Object.assign(session, rest);
  await session.save();
  return ok(res, session);
});

// POST /api/training-sessions/:id/assign  { employeeIds: [...] }
// Bulk-assigns employees to a session, creating attendance records.
const assignEmployees = asyncHandler(async (req, res) => {
  const { employeeIds } = req.body;
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    return fail(res, 400, "employeeIds must be a non-empty array.");
  }
  const session = await TrainingSession.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!session) return fail(res, 404, "Training session not found.");

  const validEmployees = await Employee.find({ _id: { $in: employeeIds }, company: req.companyId }).select("_id");
  const validIds = validEmployees.map((e) => e._id.toString());

  const results = [];
  for (const empId of validIds) {
    const record = await TrainingAttendance.findOneAndUpdate(
      { session: session._id, employee: empId },
      { $setOnInsert: { company: req.companyId, program: session.program, status: "assigned" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    results.push(record);
  }
  return ok(res, results);
});

// GET /api/training-sessions/:id/attendance
const getSessionAttendance = asyncHandler(async (req, res) => {
  const session = await TrainingSession.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!session) return fail(res, 404, "Training session not found.");

  const attendance = await TrainingAttendance.find({ company: req.companyId, session: session._id })
    .populate("employee", "name employeeId email");
  return ok(res, attendance);
});

module.exports = { createSession, getSessions, getSessionById, updateSession, assignEmployees, getSessionAttendance };
