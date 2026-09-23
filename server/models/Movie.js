const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    genre: {
      type: [String],
      default: [],
    },

    releaseYear: {
      type: Number,
    },

    releaseDate: {
      type: String,
    },

    director: {
      type: String,
      trim: true,
    },

    cast: {
      type: [String],
      default: [],
    },

    poster: {
      type: String,
    },

    initialRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Calculated from actual reviews
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Calculated from actual reviews
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    sourceId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

movieSchema.index({ title: 1 });
movieSchema.index({ releaseYear: 1 });

module.exports = mongoose.model("Movie", movieSchema);