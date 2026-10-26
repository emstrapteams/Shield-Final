
const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema(
  {
    // Company that owns this emergency
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    // Employee who reported the emergency
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Category of emergency
    type: {
      type: String,
      enum: [
        "medical",
        "fire",
        "accident",
        "electrical",
        "chemical",
        "gas",
        "vehicle",
        "equipment",
        "security",
        "emergency_alert",
        "other",
      ],
      required: true,
    },

    // Brief description
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // GPS coordinates
    location: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
      accuracy: {
        type: Number,
        min: 0,
        default: null,
      },
      address: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // Evidence attached to the emergency
    evidence: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          default: null,
        },
        mediaType: {
          type: String,
          enum: ["image", "video"],
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Emergency lifecycle
    status: {
      type: String,
      enum: [
        "triggered",
        "alert_created",
        "response_in_progress",
        "resolved",
        "closed",
        "cancelled",
      ],
      default: "triggered",
      index: true,
    },

    // Acknowledgement details
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    acknowledgedAt: {
      type: Date,
      default: null,
    },

    // Response initiation details
    responseStartedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    responseStartedAt: {
      type: Date,
      default: null,
    },

    // Resolution details
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    // Closure details
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    // Cancellation details
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    // Emergency action history
    responseHistory: [
      {
        action: {
          type: String,
          enum: [
            "triggered",
            "acknowledged",
            "response_started",
            "status_updated",
            "resolved",
            "closed",
            "cancelled",
          ],
          required: true,
        },

        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        note: {
          type: String,
          trim: true,
          maxlength: 1000,
          default: "",
        },

        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Efficient queries for company dashboards and employee history
emergencySchema.index({ company: 1, createdAt: -1 });
emergencySchema.index({ reportedBy: 1, createdAt: -1 });
emergencySchema.index({ company: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Emergency", emergencySchema);