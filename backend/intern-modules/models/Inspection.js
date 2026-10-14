const mongoose = require("mongoose");

/**
 * Reusable inspection record for any equipment type.
 * The checklist is configurable for each inspection.
 * The overall result is derived automatically from checklist results.
 */

const ITEM_RESULTS = ["pass", "fail", "needs_attention", "not_applicable"];
const OVERALL_RESULTS = ["passed", "failed", "needs_attention"];

const checklistItemSchema = new mongoose.Schema(
  {
    item: { type: String, required: true, trim: true },
    result: { type: String, enum: ITEM_RESULTS, required: true },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const inspectionSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
      index: true,
    },

    inspector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    inspectorName: { type: String, trim: true, default: "" },

    inspectionDate: { type: Date, required: true, default: Date.now },

    checklist: {
      type: [checklistItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one checklist item is required.",
      },
    },

    result: { type: String, enum: OVERALL_RESULTS },

    notes: { type: String, trim: true, default: "" },
    photos: [{ type: String, trim: true }],

    nextInspectionDate: { type: Date },
  },
  { timestamps: true }
);

// Derive the overall result from checklist results.
inspectionSchema.pre("validate", function () {
  const results = (this.checklist || []).map((item) => item.result);

  if (results.includes("fail")) {
    this.result = "failed";
  } else if (results.includes("needs_attention")) {
    this.result = "needs_attention";
  } else {
    this.result = "passed";
  }
});

inspectionSchema.statics.ITEM_RESULTS = ITEM_RESULTS;
inspectionSchema.statics.OVERALL_RESULTS = OVERALL_RESULTS;

module.exports = mongoose.model("Inspection", inspectionSchema);