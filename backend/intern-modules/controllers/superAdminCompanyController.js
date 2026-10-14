const Company = require("../models/Company");
const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Facility = require("../models/Facility");
const Equipment = require("../models/Equipment");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, fail } = require("../utils/apiResponse");
const { parsePagination, pageMeta } = require("../utils/scope");
const { recordAudit } = require("../utils/audit");

// Super Admin business CRUD for companies. Platform-wide — not scoped by
// req.companyId, since a Super Admin operates across companies. Super
// Admin authentication/authorization is NOT implemented here (developed
// separately); this is CRUD only.

// POST /api/companies
const createCompany = asyncHandler(async (req, res) => {
  const company = await Company.create(req.body);
  await recordAudit(req, { action: "company_created", resourceType: "Company", resourceId: company._id, metadata: { name: company.name } });
  return created(res, company);
});

// GET /api/companies?search=&status=&page=&limit=
const getCompanies = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { code: { $regex: search, $options: "i" } }];

  const { pageNum, limitNum, skip } = parsePagination(req.query);
  const [items, total] = await Promise.all([
    Company.find(filter).sort({ name: 1 }).skip(skip).limit(limitNum),
    Company.countDocuments(filter),
  ]);
  return ok(res, items, pageMeta(pageNum, limitNum, total));
});

// GET /api/companies/:id
const getCompanyById = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) return fail(res, 404, "Company not found.");
  return ok(res, company);
});

// GET /api/companies/:id/usage
// View company usage — counts across the modules this project implements.
const getCompanyUsage = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) return fail(res, 404, "Company not found.");

  const [employees, departments, facilities, equipment] = await Promise.all([
    Employee.countDocuments({ company: company._id }),
    Department.countDocuments({ company: company._id }),
    Facility.countDocuments({ company: company._id }),
    Equipment.countDocuments({ company: company._id }),
  ]);

  return ok(res, { company: { id: company._id, name: company.name, status: company.status }, employees, departments, facilities, equipment });
});

// PUT /api/companies/:id
const updateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) return fail(res, 404, "Company not found.");
  Object.assign(company, req.body);
  await company.save();
  await recordAudit(req, { action: "company_updated", resourceType: "Company", resourceId: company._id });
  return ok(res, company);
});

// PATCH /api/companies/:id/status  { status: 'active'|'suspended'|'deactivated' }
const setCompanyStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["active", "suspended", "deactivated"].includes(status)) {
    return fail(res, 400, "status must be one of: active, suspended, deactivated");
  }
  const company = await Company.findById(req.params.id);
  if (!company) return fail(res, 404, "Company not found.");
  company.status = status;
  await company.save();
  await recordAudit(req, { action: "company_status_changed", resourceType: "Company", resourceId: company._id, metadata: { status } });
  return ok(res, company);
});

module.exports = { createCompany, getCompanies, getCompanyById, getCompanyUsage, updateCompany, setCompanyStatus };
