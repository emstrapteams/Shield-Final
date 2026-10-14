const mongoose = require("mongoose");

const SOURCE_TYPES = ["inspection", "equipment", "drill", "safety_issue", "other"];
const PRIORITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["pending", "in_progress", "completed", "overdue", "verified"];

const correctiveActionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },

    sourceType: { type: String, enum: SOURCE_TYPES, required: true },
    // Loosely typed reference id — may point at an Inspection, Equipment,
    // Drill, etc. depending on sourceType. Not a strict ref() because the
    // source model varies.
    sourceId: { type: mongoose.Schema.Types.ObjectId, default: null },

    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    assignedTeam: { type: String, trim: true, default: "" },

    priority: { type: String, enum: PRIORITIES, default: "medium" },
    dueDate: { type: Date },

    status: { type: String, enum: STATUSES, default: "pending" },

    evidence: [{ type: String, trim: true }], // photo/document URLs or references
    verificationNotes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// Auto-escalate to 'overdue' when past due date and not yet resolved,
// without clobbering a manually-set completed/verified status.

correctiveActionSchema.pre("save", function () {
  if (["completed", "verified"].includes(this.status)) {
    return;
  }

  if (this.dueDate && new Date(this.dueDate) < new Date()) {
    this.status = "overdue";
  }
});


correctiveActionSchema.statics.SOURCE_TYPES = SOURCE_TYPES;
correctiveActionSchema.statics.PRIORITIES = PRIORITIES;
correctiveActionSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model("CorrectiveAction", correctiveActionSchema);
