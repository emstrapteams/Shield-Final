const CorrectiveAction = require("../models/CorrectiveAction");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, fail } = require("../utils/apiResponse");

const scopedFilter = (req, extra = {}) => {
  if (!req.companyId) return { _blockAll: true };
  return { company: req.companyId, ...extra };
};

// POST /api/corrective-actions
const createCorrectiveAction = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const action = await CorrectiveAction.create({ ...req.body, company: req.companyId });
  return created(res, action);
});

// GET /api/corrective-actions?search=&sourceType=&priority=&status=&assignedTo=&overdue=&page=&limit=
const getCorrectiveActions = asyncHandler(async (req, res) => {
  const { search, sourceType, priority, status, assignedTo, overdue, page = 1, limit = 20 } = req.query;

  const filter = scopedFilter(req);
  if (sourceType) filter.sourceType = sourceType;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (search) filter.title = { $regex: search, $options: "i" };

  if (overdue === "true") {
    filter.dueDate = { $lt: new Date() };
    filter.status = { $nin: ["completed", "verified"] };
  } else if (status) {
    filter.status = status;
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [items, total] = await Promise.all([
    CorrectiveAction.find(filter)
      .populate("assignedTo", "name employeeId")
      .sort({ dueDate: 1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    CorrectiveAction.countDocuments(filter),
  ]);

  return ok(res, items, { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 });
});

// GET /api/corrective-actions/:id
const getCorrectiveActionById = asyncHandler(async (req, res) => {
  const action = await CorrectiveAction.findOne(scopedFilter(req, { _id: req.params.id })).populate("assignedTo", "name employeeId");
  if (!action) return fail(res, 404, "Corrective action not found.");
  return ok(res, action);
});

// PUT /api/corrective-actions/:id
const updateCorrectiveAction = asyncHandler(async (req, res) => {
  const action = await CorrectiveAction.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!action) return fail(res, 404, "Corrective action not found.");

  const { company, ...rest } = req.body;
  Object.assign(action, rest);
  await action.save();
  return ok(res, action);
});

// PATCH /api/corrective-actions/:id/status
const setCorrectiveActionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!CorrectiveAction.STATUSES.includes(status)) {
    return fail(res, 400, `status must be one of: ${CorrectiveAction.STATUSES.join(", ")}`);
  }
  const action = await CorrectiveAction.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!action) return fail(res, 404, "Corrective action not found.");
  action.status = status;
  await action.save();
  return ok(res, action);
});

// PATCH /api/corrective-actions/:id/evidence
const addCorrectiveActionEvidence = asyncHandler(async (req, res) => {
  const { evidence } = req.body; // array of URLs/strings, or a single string
  const action = await CorrectiveAction.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!action) return fail(res, 404, "Corrective action not found.");

  const items = Array.isArray(evidence) ? evidence : [evidence];
  action.evidence.push(...items.filter(Boolean));
  await action.save();
  return ok(res, action);
});

// PATCH /api/corrective-actions/:id/verify
const verifyCorrectiveAction = asyncHandler(async (req, res) => {
  const { verificationNotes } = req.body;
  const action = await CorrectiveAction.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!action) return fail(res, 404, "Corrective action not found.");

  if (action.status !== "completed") {
    return fail(res, 400, "Only a 'completed' action can be verified.");
  }

  action.status = "verified";
  if (verificationNotes) action.verificationNotes = verificationNotes;
  await action.save();
  return ok(res, action);
});

module.exports = {
  createCorrectiveAction,
  getCorrectiveActions,
  getCorrectiveActionById,
  updateCorrectiveAction,
  setCorrectiveActionStatus,
  addCorrectiveActionEvidence,
  verifyCorrectiveAction,
};
