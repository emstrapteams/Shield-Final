const { fail } = require("../utils/apiResponse");

// Centralized error handler. Keeps controllers free of repetitive
// try/catch -> status-code translation logic.
const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return fail(res, 400, "Validation failed.", errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(", ");
    return fail(res, 409, `Duplicate value for field(s): ${field}`);
  }

  // Invalid ObjectId cast
  if (err.name === "CastError") {
    return fail(res, 400, `Invalid ID format for field: ${err.path}`);
  }

  return fail(res, err.status || 500, err.message || "Internal server error.");
};

const notFound = (req, res) => fail(res, 404, `Route not found: ${req.originalUrl}`);

module.exports = { errorHandler, notFound };
