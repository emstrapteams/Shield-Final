const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const Facility = require("../models/Facility");
const Equipment = require("../models/Equipment");
const Inspection = require("../models/Inspection");
const CorrectiveAction = require("../models/CorrectiveAction");
const TrainingAttendance = require("../models/TrainingAttendance");
const TrainingSession = require("../models/TrainingSession");
const Drill = require("../models/Drill");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/apiResponse");

// Aggregation only — no authentication or access-control logic. Who is
// allowed to view which company's dashboard is decided by the separately
// developed auth/company-isolation layer, not here.

// GET /api/dashboard/overview?facility=
const getOverview = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const companyId = new mongoose.Types.ObjectId(req.companyId);
  const { facility } = req.query;
  const facilityFilter = facility ? { facility: new mongoose.Types.ObjectId(facility) } : {};

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [
    employeeCounts,
    facilityCounts,
    equipmentCounts,
    upcomingInspectionsCount,
    inspectionResultCounts,
    correctiveActionCounts,
    upcomingDrillsCount,
    openDrillIssues,
    trainingCounts,
    upcomingSessionsCount,
  ] = await Promise.all([
    Employee.aggregate([{ $match: { company: companyId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Facility.aggregate([{ $match: { company: companyId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Equipment.aggregate([{ $match: { company: companyId, ...facilityFilter } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Equipment.countDocuments({ company: companyId, ...facilityFilter, nextInspectionDate: { $lte: in7Days, $gte: now } }),
    Inspection.aggregate([{ $match: { company: companyId, inspectionDate: { $gte: last30Days } } }, { $group: { _id: "$result", count: { $sum: 1 } } }]),
    CorrectiveAction.aggregate([{ $match: { company: companyId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Drill.countDocuments({ company: companyId, ...facilityFilter, date: { $gte: now, $lte: in90Days }, status: "scheduled" }),
    Drill.aggregate([
      { $match: { company: companyId, ...facilityFilter } },
      { $project: { issueCount: { $size: "$issues" } } },
      { $group: { _id: null, total: { $sum: "$issueCount" } } },
    ]),
    TrainingAttendance.aggregate([{ $match: { company: companyId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    TrainingSession.countDocuments({ company: companyId, ...facilityFilter, scheduledDate: { $gte: now }, status: "scheduled" }),
  ]);

  const toMap = (rows, keys) => {
    const map = Object.fromEntries(keys.map((k) => [k, 0]));
    rows.forEach((r) => { if (r._id in map) map[r._id] = r.count; });
    return map;
  };

  const employees = toMap(employeeCounts, ["active", "inactive"]);
  const facilities = toMap(facilityCounts, ["active", "inactive"]);
  const equipment = toMap(equipmentCounts, ["active", "inspection_due", "overdue", "replacement_required", "inactive"]);
  const inspectionResults = toMap(inspectionResultCounts, ["passed", "failed", "needs_attention"]);
  const correctiveActions = toMap(correctiveActionCounts, ["pending", "in_progress", "completed", "overdue", "verified"]);
  const trainingByStatus = toMap(trainingCounts, ["assigned", "attended", "completed", "missed"]);

  const totalTraining = Object.values(trainingByStatus).reduce((a, b) => a + b, 0);
  const trainingCompletionPercentage = totalTraining ? Math.round((trainingByStatus.completed / totalTraining) * 100) : 0;

  return ok(res, {
    employees: { total: employees.active + employees.inactive, ...employees },
    facilities: { total: facilities.active + facilities.inactive, ...facilities },
    equipment: {
      total: Object.values(equipment).reduce((a, b) => a + b, 0),
      byStatus: equipment,
      inspectionsDueNext7Days: upcomingInspectionsCount,
    },
    inspections: { last30Days: inspectionResults },
    correctiveActions: {
      total: Object.values(correctiveActions).reduce((a, b) => a + b, 0),
      byStatus: correctiveActions,
      open: correctiveActions.pending + correctiveActions.in_progress + correctiveActions.overdue,
    },
    training: {
      completionPercentage: trainingCompletionPercentage,
      byStatus: trainingByStatus,
      upcomingSessions: upcomingSessionsCount,
    },
    drills: {
      upcomingNext90Days: upcomingDrillsCount,
      openIssues: (openDrillIssues[0] && openDrillIssues[0].total) || 0,
    },
  });
});

module.exports = { getOverview };
