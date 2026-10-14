const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Facility = require("../models/Facility");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, fail } = require("../utils/apiResponse");

// Builds a Mongo filter that is ALWAYS scoped to req.companyId.
// This is the single choke point every query passes through, so isolation
// cannot be bypassed by a controller forgetting to add it ad hoc.
const scopedFilter = (req, extra = {}) => {
  if (!req.companyId) return { _blockAll: true }; // super_admin with no companyId -> no results
  return { company: req.companyId, ...extra };
};

// POST /api/employees
const createEmployee = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required to create an employee.");

  const payload = { ...req.body, company: req.companyId };
  const employee = await Employee.create(payload);
  employee.history.push({ action: "created", detail: "Employee record created." });
  await employee.save();

  return created(res, employee);
});

// GET /api/employees?search=&department=&facility=&status=&page=&limit=
const getEmployees = asyncHandler(async (req, res) => {
  const { search, department, facility, status, page = 1, limit = 20 } = req.query;

  const filter = scopedFilter(req);
  if (department) filter.department = department;
  if (facility) filter.facility = facility;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { employeeId: { $regex: search, $options: "i" } },
      { designation: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [items, total] = await Promise.all([
    Employee.find(filter)
      .populate("department", "name")
      .populate("facility", "name city")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Employee.countDocuments(filter),
  ]);

  return ok(res, items, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
  });
});

// GET /api/employees/:id
const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne(scopedFilter(req, { _id: req.params.id }))
    .populate("department", "name")
    .populate("facility", "name city");

  if (!employee) return fail(res, 404, "Employee not found.");
  return ok(res, employee);
});

// PUT /api/employees/:id
const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!employee) return fail(res, 404, "Employee not found.");

  // company is never editable via the payload -- it is fixed at creation.
  const { company, history, ...rest } = req.body;
  Object.assign(employee, rest);
  employee.history.push({ action: "updated", detail: "Employee record updated." });
  await employee.save();

  return ok(res, employee);
});

// PATCH /api/employees/:id/status
const setEmployeeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["active", "inactive"].includes(status)) {
    return fail(res, 400, "status must be 'active' or 'inactive'.");
  }

  const employee = await Employee.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!employee) return fail(res, 404, "Employee not found.");

  employee.status = status;
  employee.history.push({ action: status === "active" ? "activated" : "deactivated" });
  await employee.save();

  return ok(res, employee);
});

// GET /api/employees/:id/history
const getEmployeeHistory = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne(scopedFilter(req, { _id: req.params.id })).select("history employeeId name");
  if (!employee) return fail(res, 404, "Employee not found.");
  return ok(res, employee.history);
});

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  setEmployeeStatus,
  getEmployeeHistory,
};
