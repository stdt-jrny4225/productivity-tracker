const mongoose = require("mongoose");

const timeLogSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    hostname: { type: String, required: true },
    duration: { type: Number, required: true }, // seconds
    category: {
      type: String,
      enum: ["productive", "unproductive", "uncategorized"],
      default: "uncategorized"
    }
  },
  { timestamps: true }
);

// one record per user+day+domain (upsert)
timeLogSchema.index({ userId: 1, date: 1, hostname: 1 }, { unique: true });

module.exports = mongoose.model("TimeLog", timeLogSchema);
