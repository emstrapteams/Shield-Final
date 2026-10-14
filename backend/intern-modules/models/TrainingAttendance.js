const mongoose = require("mongoose");

const STATUSES = ["assigned", "attended", "completed", "missed"];

const trainingAttendanceSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: "TrainingSession", required: true, index: true },
    // Denormalised from the session so history/statistics can filter by
    // program without an extra lookup.
    program: { type: mongoose.Schema.Types.ObjectId, ref: "TrainingProgram", required: true, index: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    status: { type: String, enum: STATUSES, default: "assigned" },
    completedAt: { type: Date },
    certificates: [{ type: String, trim: true }], // certificate/document URLs or references
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

trainingAttendanceSchema.index({ session: 1, employee: 1 }, { unique: true });
trainingAttendanceSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model("TrainingAttendance", trainingAttendanceSchema);
