const mongoose = require("mongoose");

/**
 * Emergency Resource — CONFIGURATION/MANAGEMENT ONLY.
 * This stores which internal/external resources a company has configured.
 * It deliberately contains no emergency triggering, workflow, resource
 * selection, request sending, or external-service integration logic —
 * that engine is developed separately.
 */
const INTERNAL_TYPES = ["security_team", "safety_team", "first_responders", "company_ambulance", "emergency_contact"];
const EXTERNAL_TYPES = ["ambulance_provider", "hospital", "fire_response_provider", "other_emergency_service"];
const CATEGORIES = ["internal", "external"];
const INTEGRATION_STATUSES = ["not_integrated", "in_progress", "integrated"]; // status flag only, no live integration

const emergencyResourceSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    category: { type: String, enum: CATEGORIES, required: true },
    serviceType: { type: String, enum: [...INTERNAL_TYPES, ...EXTERNAL_TYPES], required: true },
    name: { type: String, required: true, trim: true },
    contact: {
      contactPerson: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
    },
    location: { type: String, trim: true, default: "" },
    coverageArea: { type: String, trim: true, default: "" },
    availability: { type: String, trim: true, default: "" }, // free-text, e.g. "24x7" or "Mon-Fri 9-6"
    priority: { type: Number, min: 1, max: 5, default: 3 }, // 1 = highest
    integrationStatus: { type: String, enum: INTEGRATION_STATUSES, default: "not_integrated" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

emergencyResourceSchema.index({ company: 1, serviceType: 1, name: 1 }, { unique: true });

emergencyResourceSchema.pre("validate", function () {
  const internal = INTERNAL_TYPES.includes(this.serviceType);
  const external = EXTERNAL_TYPES.includes(this.serviceType);

  if (this.category === "internal" && !internal) {
    this.invalidate(
      "serviceType",
      "serviceType is not valid for an internal resource."
    );
  }

  if (this.category === "external" && !external) {
    this.invalidate(
      "serviceType",
      "serviceType is not valid for an external resource."
    );
  }
});

emergencyResourceSchema.statics.INTERNAL_TYPES = INTERNAL_TYPES;
emergencyResourceSchema.statics.EXTERNAL_TYPES = EXTERNAL_TYPES;
emergencyResourceSchema.statics.CATEGORIES = CATEGORIES;
emergencyResourceSchema.statics.INTEGRATION_STATUSES = INTEGRATION_STATUSES;

module.exports = mongoose.model("EmergencyResource", emergencyResourceSchema);
