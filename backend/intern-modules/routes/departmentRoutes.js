const express = require("express");
const { validateDepartment } = require("../validation/departmentValidation");
const {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  setDepartmentStatus,
  getDepartmentEmployees,
} = require("../controllers/departmentController");

const router = express.Router();

router.get("/", getDepartments);
router.post("/", validateDepartment, createDepartment);
router.get("/:id", getDepartmentById);
router.put("/:id", validateDepartment, updateDepartment);
router.patch("/:id/status", setDepartmentStatus);
router.get("/:id/employees", getDepartmentEmployees);

module.exports = router;
