const Department = require("../models/Department");
const Employee = require("../models/Employee");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, fail } = require("../utils/apiResponse");

const scopedFilter = (req, extra = {}) => {
  if (!req.companyId) return { _blockAll: true };
  return { company: req.companyId, ...extra };
};

// POST /api/departments
const createDepartment = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required to create a department.");
  const department = await Department.create({ ...req.body, company: req.companyId });
  return created(res, department);
});

// GET /api/departments?search=&status=&page=&limit=
const getDepartments = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;

  const filter = scopedFilter(req);
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: "i" };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [items, total] = await Promise.all([
    Department.find(filter).sort({ name: 1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    Department.countDocuments(filter),
  ]);

  return ok(res, items, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
  });
});

// GET /api/departments/:id
const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!department) return fail(res, 404, "Department not found.");
  return ok(res, department);
});

// PUT /api/departments/:id
const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!department) return fail(res, 404, "Department not found.");

  const { company, ...rest } = req.body;
  Object.assign(department, rest);
  await department.save();

  return ok(res, department);
});

// PATCH /api/departments/:id/status
const setDepartmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["active", "inactive"].includes(status)) {
    return fail(res, 400, "status must be 'active' or 'inactive'.");
  }

  const department = await Department.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!department) return fail(res, 404, "Department not found.");

  department.status = status;
  await department.save();

  return ok(res, department);
});

// GET /api/departments/:id/employees
// Confirms the department belongs to the caller's company BEFORE returning
// any employees, so this cannot be used to enumerate another company's staff.
const getDepartmentEmployees = asyncHandler(async (req, res) => {
  const department = await Department.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!department) return fail(res, 404, "Department not found.");

  const employees = await Employee.find({ company: req.companyId, department: department._id }).select(
    "employeeId name email phone status designation"
  );

  return ok(res, employees);
});

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  setDepartmentStatus,
  getDepartmentEmployees,
};
