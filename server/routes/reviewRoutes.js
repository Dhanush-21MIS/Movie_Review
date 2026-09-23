const express = require("express");

const Review = require("../models/Review");
const Movie = require("../models/Movie");
const authMiddleware = require("../middleware/AuthMiddleware");

const router = express.Router();

// ======================================================
// HELPER: UPDATE MOVIE REVIEW STATISTICS
// ======================================================

const updateMovieReviewStats = async (movieId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        movie: movieId,
      },
    },
    {
      $group: {
        _id: "$movie",
        reviewCount: {
          $sum: 1,
        },
        averageRating: {
          $avg: "$rating",
        },
      },
    },
  ]);

  if (stats.length === 0) {
    await Movie.findByIdAndUpdate(movieId, {
      reviewCount: 0,
      averageRating: 0,
    });

    return;
  }

  await Movie.findByIdAndUpdate(movieId, {
    reviewCount: stats[0].reviewCount,
    averageRating: Number(
      stats[0].averageRating.toFixed(1)
    ),
  });
};

// ======================================================
// GET MY REVIEWS
// GET /api/reviews/my
// ======================================================

router.get(
  "/my",
  authMiddleware,
  async (req, res) => {
    try {
      const reviews = await Review.find({
        user: req.user.id,
      })
        .populate(
          "movie",
          "title poster releaseYear"
        )
        .sort({
          createdAt: -1,
        });

      return res.status(200).json({
        success: true,
        reviews,
      });
    } catch (error) {
      console.error(
        "Get my reviews error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load your reviews",
      });
    }
  }
);

// ======================================================
// GET REVIEWS FOR A MOVIE
// GET /api/reviews/movie/:movieId
// ======================================================

router.get(
  "/movie/:movieId",
  async (req, res) => {
    try {
      const { movieId } = req.params;

      const reviews = await Review.find({
        movie: movieId,
      })
        .populate(
          "user",
          "name email profilePhoto"
        )
        .sort({
          createdAt: -1,
        });

      return res.status(200).json({
        success: true,
        reviews,
      });
    } catch (error) {
      console.error(
        "Get movie reviews error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load movie reviews",
      });
    }
  }
);

// ======================================================
// CREATE REVIEW
// POST /api/reviews/:movieId
// ======================================================

router.post(
  "/:movieId",
  authMiddleware,
  async (req, res) => {
    try {
      const { movieId } = req.params;

      const {
        rating,
        comment,
      } = req.body;

      // -----------------------------------------------
      // Validate rating
      // -----------------------------------------------

      const numericRating =
        Number(rating);

      if (
        !Number.isFinite(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Rating must be between 1 and 5",
        });
      }

      // -----------------------------------------------
      // Validate comment
      // -----------------------------------------------

      const cleanComment =
        String(comment || "").trim();

      if (!cleanComment) {
        return res.status(400).json({
          success: false,
          message:
            "Review comment is required",
        });
      }

      if (cleanComment.length < 3) {
        return res.status(400).json({
          success: false,
          message:
            "Review must contain at least 3 characters",
        });
      }

      if (cleanComment.length > 2000) {
        return res.status(400).json({
          success: false,
          message:
            "Review cannot exceed 2000 characters",
        });
      }

      // -----------------------------------------------
      // Check movie
      // -----------------------------------------------

      const movie =
        await Movie.findById(movieId);

      if (!movie) {
        return res.status(404).json({
          success: false,
          message:
            "Movie not found",
        });
      }

      // -----------------------------------------------
      // Check if user already reviewed this movie
      // -----------------------------------------------

      const existingReview =
        await Review.findOne({
          user: req.user.id,
          movie: movieId,
        });

      if (existingReview) {
        return res.status(409).json({
          success: false,
          message:
            "You have already reviewed this movie",
          review: existingReview,
        });
      }

      // -----------------------------------------------
      // Create review
      // -----------------------------------------------

      const review =
        await Review.create({
          user: req.user.id,
          movie: movieId,
          rating: numericRating,
          comment: cleanComment,
        });

      // -----------------------------------------------
      // Update movie statistics
      // -----------------------------------------------

      await updateMovieReviewStats(
        movie._id
      );

      // -----------------------------------------------
      // Populate response
      // -----------------------------------------------

      const populatedReview =
        await Review.findById(
          review._id
        )
          .populate(
            "user",
            "name email profilePhoto"
          )
          .populate(
            "movie",
            "title poster releaseYear"
          );

      return res.status(201).json({
        success: true,
        message:
          "Review added successfully",
        review: populatedReview,
      });
    } catch (error) {
      console.error(
        "Create review error:",
        error
      );

      // MongoDB duplicate-key protection
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "You have already reviewed this movie",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Failed to add review",
      });
    }
  }
);

// ======================================================
// EDIT REVIEW
// PUT /api/reviews/:id
// ======================================================

router.put(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        rating,
        comment,
      } = req.body;

      // -----------------------------------------------
      // Validate rating
      // -----------------------------------------------

      const numericRating =
        Number(rating);

      if (
        !Number.isFinite(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Rating must be between 1 and 5",
        });
      }

      // -----------------------------------------------
      // Validate comment
      // -----------------------------------------------

      const cleanComment =
        String(comment || "").trim();

      if (!cleanComment) {
        return res.status(400).json({
          success: false,
          message:
            "Review comment is required",
        });
      }

      if (cleanComment.length < 3) {
        return res.status(400).json({
          success: false,
          message:
            "Review must contain at least 3 characters",
        });
      }

      if (cleanComment.length > 2000) {
        return res.status(400).json({
          success: false,
          message:
            "Review cannot exceed 2000 characters",
        });
      }

      // -----------------------------------------------
      // Find review belonging to current user
      // -----------------------------------------------

      const review =
        await Review.findOne({
          _id: id,
          user: req.user.id,
        });

      if (!review) {
        return res.status(404).json({
          success: false,
          message:
            "Review not found or you do not have permission to edit it",
        });
      }

      // -----------------------------------------------
      // Save old movie ID
      // -----------------------------------------------

      const movieId = review.movie;

      // -----------------------------------------------
      // Update review
      // -----------------------------------------------

      review.rating =
        numericRating;

      review.comment =
        cleanComment;

      await review.save();

      // -----------------------------------------------
      // Recalculate movie statistics
      // -----------------------------------------------

      await updateMovieReviewStats(
        movieId
      );

      // -----------------------------------------------
      // Populate response
      // -----------------------------------------------

      const updatedReview =
        await Review.findById(
          review._id
        )
          .populate(
            "user",
            "name email profilePhoto"
          )
          .populate(
            "movie",
            "title poster releaseYear"
          );

      return res.status(200).json({
        success: true,
        message:
          "Review updated successfully",
        review: updatedReview,
      });
    } catch (error) {
      console.error(
        "Update review error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update review",
      });
    }
  }
);

// ======================================================
// DELETE REVIEW
// DELETE /api/reviews/:id
// ======================================================

router.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // -----------------------------------------------
      // Find review belonging to current user
      // -----------------------------------------------

      const review =
        await Review.findOne({
          _id: id,
          user: req.user.id,
        });

      if (!review) {
        return res.status(404).json({
          success: false,
          message:
            "Review not found or you do not have permission to delete it",
        });
      }

      const movieId =
        review.movie;

      // -----------------------------------------------
      // Delete review
      // -----------------------------------------------

      await Review.findByIdAndDelete(
        review._id
      );

      // -----------------------------------------------
      // Recalculate movie statistics
      // -----------------------------------------------

      await updateMovieReviewStats(
        movieId
      );

      return res.status(200).json({
        success: true,
        message:
          "Review deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete review error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete review",
      });
    }
  }
);

module.exports = router;