const mongoose = require("mongoose");

const TYPES = ["fire", "evacuation", "medical_emergency", "custom"];
const STATUSES = ["scheduled", "in_progress", "completed", "cancelled"];
const SEVERITIES = ["low", "medium", "high"];

const drillSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    facility: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: TYPES, required: true },
    scenario: { type: String, trim: true, default: "" },
    date: { type: Date, required: true },
    startTime: { type: String, trim: true, default: "" }, // HH:mm
    endTime: { type: String, trim: true, default: "" }, // HH:mm
    completionTimeMinutes: { type: Number, min: 0 }, // how long the drill took to complete
    status: { type: String, enum: STATUSES, default: "scheduled" },

    participants: [
      {
        _id: false,
        employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
        attended: { type: Boolean, default: false },
        notes: { type: String, trim: true, default: "" },
      },
    ],

    observations: [{ text: { type: String, required: true, trim: true }, createdAt: { type: Date, default: Date.now } }],
    issues: [
      {
        description: { type: String, required: true, trim: true },
        severity: { type: String, enum: SEVERITIES, default: "medium" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    correctiveActions: [{ type: mongoose.Schema.Types.ObjectId, ref: "CorrectiveAction" }],
  },
  { timestamps: true }
);

drillSchema.statics.TYPES = TYPES;
drillSchema.statics.STATUSES = STATUSES;
drillSchema.statics.SEVERITIES = SEVERITIES;

module.exports = mongoose.model("Drill", drillSchema);
