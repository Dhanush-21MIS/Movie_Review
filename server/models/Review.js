const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// One user can review a movie only once.
reviewSchema.index(
  { user: 1, movie: 1 },
  { unique: true }
);

// Useful when loading movie reviews.
reviewSchema.index({
  movie: 1,
  createdAt: -1,
});

reviewSchema.index({
  user: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Review", reviewSchema);