const mongoose = require("mongoose");
const { TRAINING_SESSIONS_PER_YEAR } = require("../config/defaults");

const TYPES = ["fire_safety", "first_aid", "emergency_response", "industry_specific", "custom"];

const trainingProgramSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: TYPES, required: true },
    description: { type: String, trim: true, default: "" },
    trainer: { type: String, trim: true, default: "" },
    durationHours: { type: Number, min: 0, default: 0 },
    // Configurable business rule (currently "two per year"). Not hardcoded:
    // each program carries its own value, defaulting from config/defaults.js.
    requiredSessionsPerYear: { type: Number, min: 0, default: TRAINING_SESSIONS_PER_YEAR },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

trainingProgramSchema.index({ company: 1, name: 1 }, { unique: true });
trainingProgramSchema.statics.TYPES = TYPES;

module.exports = mongoose.model("TrainingProgram", trainingProgramSchema);
