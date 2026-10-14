const TrainingAttendance = require("../models/TrainingAttendance");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/apiResponse");
const { scopedFilter, parsePagination, pageMeta } = require("../utils/scope");

// GET /api/training-attendance?employee=&program=&session=&status=&page=&limit=
// Powers "training history" from both the employee and training modules.
const getAttendance = asyncHandler(async (req, res) => {
  const { employee, program, session, status } = req.query;
  const filter = scopedFilter(req);
  if (employee) filter.employee = employee;
  if (program) filter.program = program;
  if (session) filter.session = session;
  if (status) filter.status = status;

  const { pageNum, limitNum, skip } = parsePagination(req.query);
  const [items, total] = await Promise.all([
    TrainingAttendance.find(filter)
      .populate("employee", "name employeeId")
      .populate("program", "name type")
      .populate({ path: "session", select: "scheduledDate facility", populate: { path: "facility", select: "name" } })
      .sort({ createdAt: -1 })
      .skip(skip).limit(limitNum),
    TrainingAttendance.countDocuments(filter),
  ]);
  return ok(res, items, pageMeta(pageNum, limitNum, total));
});

// PATCH /api/training-attendance/:id/status  { status, completedAt? }
const setAttendanceStatus = asyncHandler(async (req, res) => {
  const { status, completedAt } = req.body;
  if (!TrainingAttendance.STATUSES.includes(status)) {
    return fail(res, 400, `status must be one of: ${TrainingAttendance.STATUSES.join(", ")}`);
  }
  const record = await TrainingAttendance.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!record) return fail(res, 404, "Attendance record not found.");

  record.status = status;
  if (status === "completed") record.completedAt = completedAt ? new Date(completedAt) : new Date();
  await record.save();
  return ok(res, record);
});

// PATCH /api/training-attendance/:id/certificates  { certificates: [...] }
const addCertificates = asyncHandler(async (req, res) => {
  const { certificates } = req.body;
  const record = await TrainingAttendance.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!record) return fail(res, 404, "Attendance record not found.");

  const items = Array.isArray(certificates) ? certificates : [certificates];
  record.certificates.push(...items.filter(Boolean));
  await record.save();
  return ok(res, record);
});

module.exports = { getAttendance, setAttendanceStatus, addCertificates };
