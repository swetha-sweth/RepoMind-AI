
const mongoose = require("mongoose");

const repositorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    language: {
      type: String,
      default: "Unknown",
    },

    stars: {
      type: Number,
      default: 0,
    },

    forks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Repository", repositorySchema);
