const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    employeeId: { type: String, required: true, trim: true }, // human-readable ID, unique per company
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9+\-\s()]{7,20}$/, "Invalid phone number"],
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
    facility: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", default: null },
    designation: { type: String, trim: true, default: "" },
    joiningDate: { type: Date },
    emergencyContact: {
      name: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      relationship: { type: String, trim: true, default: "" },
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    // Lightweight audit trail of status/detail changes for "employee history".
    history: [
      {
        action: { type: String, required: true },
        detail: { type: String, default: "" },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

employeeSchema.index({ company: 1, employeeId: 1 }, { unique: true });
employeeSchema.index({ company: 1, email: 1 }, { unique: true });
// Supports free-text search across name/email/designation.
employeeSchema.index({ name: "text", email: "text", designation: "text" });

module.exports = mongoose.model("Employee", employeeSchema);
