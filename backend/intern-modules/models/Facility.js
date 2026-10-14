const mongoose = require("mongoose");

const facilitySchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    latitude: { type: Number },
    longitude: { type: Number },
    // Extension points for facility-level detail, used by later modules
    // (Safety Equipment, Training, Drills) without requiring a schema migration.
    buildings: [{ type: String, trim: true }],
    floors: [{ type: String, trim: true }],
    zones: [{ type: String, trim: true }],
    emergencyExits: [{ type: String, trim: true }],
    assemblyPoints: [{ type: String, trim: true }],
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

facilitySchema.index({ company: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Facility", facilitySchema);
