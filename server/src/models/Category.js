const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    hostname: { type: String, unique: true, required: true },
    category: {
      type: String,
      enum: ["productive", "unproductive", "uncategorized"],
      default: "uncategorized"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
