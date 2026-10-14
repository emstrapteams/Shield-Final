const express = require("express");
const { validateEmployee } = require("../validation/employeeValidation");
const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  setEmployeeStatus,
  getEmployeeHistory,
} = require("../controllers/employeeController");

const router = express.Router();

// Every route below requires authentication + company scoping.


router.get("/", getEmployees);
router.post("/", validateEmployee, createEmployee);
router.get("/:id", getEmployeeById);
router.put("/:id", validateEmployee, updateEmployee);
router.patch("/:id/status", setEmployeeStatus);
router.get("/:id/history", getEmployeeHistory);

module.exports = router;
