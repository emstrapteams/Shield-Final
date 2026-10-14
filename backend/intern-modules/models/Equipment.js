const mongoose = require("mongoose");

/**
 * Unified Safety Equipment model.
 *
 * Fire Extinguishers and First-Aid Kits are NOT separate collections —
 * they are specialized "types" within this one Equipment collection
 * (category + type fields), with optional type-specific detail
 * sub-documents. This avoids duplicating CRUD/search/filter logic while
 * still allowing dedicated Fire Extinguisher / First-Aid Kit endpoints
 * and UI (see fireExtinguisherController.js / firstAidKitController.js).
 */

const EQUIPMENT_CATEGORIES = ["fire_safety", "medical", "emergency_infrastructure", "other"];

const EQUIPMENT_TYPES = [
  "fire_extinguisher",
  "fire_alarm",
  "fire_hydrant",
  "sprinkler",
  "fire_blanket",
  "first_aid_kit",
  "aed",
  "stretcher",
  "emergency_exit",
  "emergency_light",
  "assembly_point",
  "other",
];

// Equipment lifecycle status. Auto-derived from dates on save (see below)
// unless manually set to 'inactive', which always wins.
const EQUIPMENT_STATUSES = ["active", "inspection_due", "overdue", "replacement_required", "inactive"];

const equipmentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    facility: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true, index: true },

    category: { type: String, enum: EQUIPMENT_CATEGORIES, required: true },
    type: { type: String, enum: EQUIPMENT_TYPES, required: true, index: true },

    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true, default: "" },

    installationDate: { type: Date },
    lastInspectionDate: { type: Date },
    nextInspectionDate: { type: Date },

    // Configurable inspection/service cadence — NOT a hardcoded legal
    // assumption. Used only to compute the "inspection_due" warning window.
    // Left null to disable auto due-window computation for this item.
    inspectionIntervalDays: { type: Number, default: null },
    dueWindowDays: { type: Number, default: 30 },

    status: { type: String, enum: EQUIPMENT_STATUSES, default: "active" },

    responsiblePerson: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    notes: { type: String, trim: true, default: "" },
    photos: [{ type: String, trim: true }],

    // Populated only when type === 'fire_extinguisher'.
    fireExtinguisher: {
      extinguisherType: { type: String, trim: true, default: "" }, // e.g. CO2, Water, Foam, Dry Chemical, ABC
      serviceDate: { type: Date },
      expiryDate: { type: Date },
    },

    // Populated only when type === 'first_aid_kit'.
    firstAidKit: {
      contentsStatus: { type: String, enum: ["ready", "needs_refill", "needs_attention", "inactive"], default: "ready" },
      refillRequired: { type: Boolean, default: false },
      expiryItems: [
        {
          itemName: { type: String, trim: true },
          expiryDate: { type: Date },
        },
      ],
    },
  },
  { timestamps: true }
);

equipmentSchema.index({ company: 1, name: "text", location: "text" });

// Auto-derive lifecycle status from dates, unless manually parked as
// 'inactive' (which always wins) or 'replacement_required' (manual flag
// also respected as-is; recomputation can still escalate from 'active').

equipmentSchema.pre("save", function () {
  if (this.status === "inactive") return;

  const today = new Date();
  const dueWindowMs =
    (this.dueWindowDays || 30) * 24 * 60 * 60 * 1000;

  const expiry = this.fireExtinguisher?.expiryDate;

  if (expiry && new Date(expiry) < today) {
    this.status = "replacement_required";
    return;
  }

  if (this.nextInspectionDate) {
    const nextInspection = new Date(this.nextInspectionDate);

    if (nextInspection < today) {
      this.status = "overdue";
      return;
    }

    if (nextInspection.getTime() - today.getTime() <= dueWindowMs) {
      this.status = "inspection_due";
      return;
    }
  }

  if (this.status !== "replacement_required") {
    this.status = "active";
  }
});

equipmentSchema.statics.CATEGORIES = EQUIPMENT_CATEGORIES;
equipmentSchema.statics.TYPES = EQUIPMENT_TYPES;
equipmentSchema.statics.STATUSES = EQUIPMENT_STATUSES;

module.exports = mongoose.model("Equipment", equipmentSchema);
