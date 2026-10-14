const mongoose = require("mongoose");

const STATUSES = ["scheduled", "in_progress", "completed", "cancelled"];

const trainingSessionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: "TrainingProgram", required: true, index: true },
    facility: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true, index: true },
    trainer: { type: String, trim: true, default: "" },
    scheduledDate: { type: Date, required: true },
    startTime: { type: String, trim: true, default: "" }, // HH:mm
    endTime: { type: String, trim: true, default: "" }, // HH:mm
    status: { type: String, enum: STATUSES, default: "scheduled" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

trainingSessionSchema.statics.STATUSES = STATUSES;
module.exports = mongoose.model("TrainingSession", trainingSessionSchema);
