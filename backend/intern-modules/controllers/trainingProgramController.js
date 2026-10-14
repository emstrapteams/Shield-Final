const TrainingProgram = require("../models/TrainingProgram");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created, fail } = require("../utils/apiResponse");
const { scopedFilter, parsePagination, pageMeta } = require("../utils/scope");

const createProgram = asyncHandler(async (req, res) => {
  if (!req.companyId) return fail(res, 400, "A companyId is required.");
  const program = await TrainingProgram.create({ ...req.body, company: req.companyId });
  return created(res, program);
});

const getPrograms = asyncHandler(async (req, res) => {
  const { search, type, status } = req.query;
  const filter = scopedFilter(req);
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: "i" };

  const { pageNum, limitNum, skip } = parsePagination(req.query);
  const [items, total] = await Promise.all([
    TrainingProgram.find(filter).sort({ name: 1 }).skip(skip).limit(limitNum),
    TrainingProgram.countDocuments(filter),
  ]);
  return ok(res, items, pageMeta(pageNum, limitNum, total));
});

const getProgramById = asyncHandler(async (req, res) => {
  const program = await TrainingProgram.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!program) return fail(res, 404, "Training program not found.");
  return ok(res, program);
});

const updateProgram = asyncHandler(async (req, res) => {
  const program = await TrainingProgram.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!program) return fail(res, 404, "Training program not found.");
  const { company, ...rest } = req.body;
  Object.assign(program, rest);
  await program.save();
  return ok(res, program);
});

const setProgramStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["active", "inactive"].includes(status)) return fail(res, 400, "status must be active or inactive.");
  const program = await TrainingProgram.findOne(scopedFilter(req, { _id: req.params.id }));
  if (!program) return fail(res, 404, "Training program not found.");
  program.status = status;
  await program.save();
  return ok(res, program);
});

module.exports = { createProgram, getPrograms, getProgramById, updateProgram, setProgramStatus };
