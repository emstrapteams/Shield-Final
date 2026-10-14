const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// A department name must be unique within a company, not globally.
departmentSchema.index({ company: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Department", departmentSchema);
