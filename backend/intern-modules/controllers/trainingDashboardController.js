const mongoose = require("mongoose");
const TrainingAttendance = require("../models/TrainingAttendance");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/apiResponse");

// GET /api/training-dashboard/stats?facility=&department=&program=&status=&from=&to=
// Aggregation only — no auth/access-control logic here (handled separately).
const getStats = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const { facility, department, program, from, to } = req.query;

  const match = { company: new mongoose.Types.ObjectId(req.companyId) };
  if (program) match.program = new mongoose.Types.ObjectId(program);

  const pipeline = [
    { $match: match },
    {
      $lookup: { from: "employees", localField: "employee", foreignField: "_id", as: "employeeDoc" },
    },
    { $unwind: "$employeeDoc" },
  ];

  if (department) pipeline.push({ $match: { "employeeDoc.department": new mongoose.Types.ObjectId(department) } });
  if (facility) pipeline.push({ $match: { "employeeDoc.facility": new mongoose.Types.ObjectId(facility) } });
  if (from || to) {
    const range = {};
    if (from) range.$gte = new Date(from);
    if (to) range.$lte = new Date(to);
    pipeline.push({ $match: { createdAt: range } });
  }

  pipeline.push({ $group: { _id: "$status", count: { $sum: 1 } } });

  const rows = await TrainingAttendance.aggregate(pipeline);
  const counts = { assigned: 0, attended: 0, completed: 0, missed: 0 };
  rows.forEach((r) => { counts[r._id] = r.count; });

  const totalEmployeesInTraining = Object.values(counts).reduce((a, b) => a + b, 0);
  const completionPercentage = totalEmployeesInTraining
    ? Math.round((counts.completed / totalEmployeesInTraining) * 100)
    : 0;

  return ok(res, {
    totalAssignments: totalEmployeesInTraining,
    completed: counts.completed,
    pending: counts.assigned + counts.attended,
    missed: counts.missed,
    completionPercentage,
    byStatus: counts,
  });
});

module.exports = { getStats };
