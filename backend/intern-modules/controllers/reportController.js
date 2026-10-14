const mongoose = require("mongoose");
const Equipment = require("../models/Equipment");
const Inspection = require("../models/Inspection");
const TrainingAttendance = require("../models/TrainingAttendance");
const Drill = require("../models/Drill");
const CorrectiveAction = require("../models/CorrectiveAction");
const asyncHandler = require("../utils/asyncHandler");
const { fail } = require("../utils/apiResponse");
const { sendReport } = require("../utils/reportService");
const { scopedFilter } = require("../utils/scope");

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "");

// GET /api/reports/equipment?format=&facility=&category=&type=&status=
const equipmentReport = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const { format, facility, category, type, status } = req.query;
  const filter = scopedFilter(req);
  if (facility) filter.facility = facility;
  if (category) filter.category = category;
  if (type) filter.type = type;
  if (status) filter.status = status;

  const items = await Equipment.find(filter).populate("facility", "name").sort({ name: 1 });
  const columns = [
    { key: "name", label: "Name" }, { key: "type", label: "Type" }, { key: "category", label: "Category" },
    { key: "facility", label: "Facility" }, { key: "location", label: "Location" },
    { key: "lastInspectionDate", label: "Last Inspection" }, { key: "nextInspectionDate", label: "Next Inspection" },
    { key: "status", label: "Status" },
  ];
  const rows = items.map((e) => ({
    name: e.name, type: e.type, category: e.category, facility: e.facility?.name || "",
    location: e.location, lastInspectionDate: fmt(e.lastInspectionDate), nextInspectionDate: fmt(e.nextInspectionDate),
    status: e.status,
  }));
  await sendReport(res, { format, filename: "equipment-report", title: "Safety Equipment Report", columns, rows });
});

// GET /api/reports/fire-extinguishers?format=&facility=&status=
const fireExtinguisherReport = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const { format, facility, status } = req.query;
  const filter = scopedFilter(req, { type: "fire_extinguisher" });
  if (facility) filter.facility = facility;
  if (status) filter.status = status;

  const items = await Equipment.find(filter).populate("facility", "name").sort({ name: 1 });
  const columns = [
    { key: "name", label: "Name" }, { key: "facility", label: "Facility" }, { key: "location", label: "Location" },
    { key: "extinguisherType", label: "Type" }, { key: "serviceDate", label: "Service Date" },
    { key: "expiryDate", label: "Expiry Date" }, { key: "nextInspectionDate", label: "Next Inspection" }, { key: "status", label: "Status" },
  ];
  const rows = items.map((e) => ({
    name: e.name, facility: e.facility?.name || "", location: e.location,
    extinguisherType: e.fireExtinguisher?.extinguisherType || "",
    serviceDate: fmt(e.fireExtinguisher?.serviceDate), expiryDate: fmt(e.fireExtinguisher?.expiryDate),
    nextInspectionDate: fmt(e.nextInspectionDate), status: e.status,
  }));
  await sendReport(res, { format, filename: "fire-extinguisher-report", title: "Fire Extinguisher Report", columns, rows });
});

// GET /api/reports/first-aid-kits?format=&facility=&status=
const firstAidReport = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const { format, facility, status } = req.query;
  const filter = scopedFilter(req, { type: "first_aid_kit" });
  if (facility) filter.facility = facility;
  if (status) filter.status = status;

  const items = await Equipment.find(filter).populate("facility", "name").sort({ name: 1 });
  const columns = [
    { key: "name", label: "Name" }, { key: "facility", label: "Facility" }, { key: "location", label: "Location" },
    { key: "contentsStatus", label: "Contents Status" }, { key: "refillRequired", label: "Refill Required" },
    { key: "nextInspectionDate", label: "Next Inspection" }, { key: "status", label: "Status" },
  ];
  const rows = items.map((e) => ({
    name: e.name, facility: e.facility?.name || "", location: e.location,
    contentsStatus: e.firstAidKit?.contentsStatus || "", refillRequired: e.firstAidKit?.refillRequired ? "Yes" : "No",
    nextInspectionDate: fmt(e.nextInspectionDate), status: e.status,
  }));
  await sendReport(res, { format, filename: "first-aid-kit-report", title: "First-Aid Kit Report", columns, rows });
});

// GET /api/reports/inspections?format=&facility=&result=&from=&to=
const inspectionReport = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const { format, facility, result, from, to } = req.query;
  const filter = scopedFilter(req);
  if (result) filter.result = result;
  if (from || to) {
    filter.inspectionDate = {};
    if (from) filter.inspectionDate.$gte = new Date(from);
    if (to) filter.inspectionDate.$lte = new Date(to);
  }
  if (facility) {
    const ids = await Equipment.find({ company: req.companyId, facility }).distinct("_id");
    filter.equipment = { $in: ids };
  }

  const items = await Inspection.find(filter)
    .populate({ path: "equipment", select: "name type facility", populate: { path: "facility", select: "name" } })
    .populate("inspector", "name")
    .sort({ inspectionDate: -1 });

  const columns = [
    { key: "date", label: "Date" }, { key: "equipment", label: "Equipment" }, { key: "type", label: "Type" },
    { key: "facility", label: "Facility" }, { key: "inspector", label: "Inspector" }, { key: "result", label: "Result" },
  ];
  const rows = items.map((i) => ({
    date: fmt(i.inspectionDate), equipment: i.equipment?.name || "", type: i.equipment?.type || "",
    facility: i.equipment?.facility?.name || "", inspector: i.inspector?.name || i.inspectorName || "", result: i.result,
  }));
  await sendReport(res, { format, filename: "inspection-report", title: "Inspection Report", columns, rows });
});

// GET /api/reports/training?format=&program=&status=
const trainingReport = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const { format, program, status } = req.query;
  const filter = scopedFilter(req);
  if (program) filter.program = program;
  if (status) filter.status = status;

  const items = await TrainingAttendance.find(filter)
    .populate("employee", "name employeeId")
    .populate("program", "name type")
    .populate({ path: "session", select: "scheduledDate facility", populate: { path: "facility", select: "name" } })
    .sort({ createdAt: -1 });

  const columns = [
    { key: "employee", label: "Employee" }, { key: "employeeId", label: "Employee ID" },
    { key: "program", label: "Program" }, { key: "sessionDate", label: "Session Date" },
    { key: "facility", label: "Facility" }, { key: "status", label: "Status" },
  ];
  const rows = items.map((a) => ({
    employee: a.employee?.name || "", employeeId: a.employee?.employeeId || "", program: a.program?.name || "",
    sessionDate: fmt(a.session?.scheduledDate), facility: a.session?.facility?.name || "", status: a.status,
  }));
  await sendReport(res, { format, filename: "training-report", title: "Training Report", columns, rows });
});

// GET /api/reports/drills?format=&facility=&type=&status=
const drillReport = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const { format, facility, type, status } = req.query;
  const filter = scopedFilter(req);
  if (facility) filter.facility = facility;
  if (type) filter.type = type;
  if (status) filter.status = status;

  const items = await Drill.find(filter).populate("facility", "name").sort({ date: -1 });
  const columns = [
    { key: "name", label: "Name" }, { key: "type", label: "Type" }, { key: "facility", label: "Facility" },
    { key: "date", label: "Date" }, { key: "participants", label: "Participants" },
    { key: "attended", label: "Attended" }, { key: "issues", label: "Issues" }, { key: "status", label: "Status" },
  ];
  const rows = items.map((d) => ({
    name: d.name, type: d.type, facility: d.facility?.name || "", date: fmt(d.date),
    participants: d.participants.length, attended: d.participants.filter((p) => p.attended).length,
    issues: d.issues.length, status: d.status,
  }));
  await sendReport(res, { format, filename: "drill-report", title: "Emergency Drill Report", columns, rows });
});

// GET /api/reports/company-safety-summary?format=
// A single-row-per-metric roll-up across every module, for a quick export.
const companySafetySummaryReport = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const { format } = req.query;
  const companyId = new mongoose.Types.ObjectId(req.companyId);

  const [equipmentByStatus, correctiveByStatus, trainingByStatus, drillCount, inspectionByResult] = await Promise.all([
    Equipment.aggregate([{ $match: { company: companyId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    CorrectiveAction.aggregate([{ $match: { company: companyId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    TrainingAttendance.aggregate([{ $match: { company: companyId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Drill.countDocuments({ company: companyId }),
    Inspection.aggregate([{ $match: { company: companyId } }, { $group: { _id: "$result", count: { $sum: 1 } } }]),
  ]);

  const rows = [];
  const pushGroup = (label, group) => group.forEach((g) => rows.push({ metric: `${label} — ${g._id}`, count: g.count }));
  pushGroup("Equipment", equipmentByStatus);
  pushGroup("Corrective Action", correctiveByStatus);
  pushGroup("Training Attendance", trainingByStatus);
  pushGroup("Inspection Result", inspectionByResult);
  rows.push({ metric: "Total Drills Recorded", count: drillCount });

  const columns = [{ key: "metric", label: "Metric" }, { key: "count", label: "Count" }];
  await sendReport(res, { format, filename: "company-safety-summary", title: "Company Safety Summary", columns, rows });
});

module.exports = {
  equipmentReport, fireExtinguisherReport, firstAidReport, inspectionReport,
  trainingReport, drillReport, companySafetySummaryReport,
};
