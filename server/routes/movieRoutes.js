const express = require("express");

const Movie = require("../models/Movie");
const Review = require("../models/Review");
const authMiddleware = require("../middleware/AuthMiddleware");

const router = express.Router();


// ======================================================
// GET ALL MOVIES
// ======================================================

router.get(
  "/",
  async (req, res) => {
    try {
      const movies =
        await Movie.find().sort({
          createdAt: -1,
        });

      return res.status(200).json(
        movies
      );

    } catch (error) {
      console.error(
        "Get movies error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch movies",
      });
    }
  }
);


// ======================================================
// GET SINGLE MOVIE
// ======================================================

router.get(
  "/:id",
  async (req, res) => {
    try {
      const movie =
        await Movie.findById(
          req.params.id
        );

      if (!movie) {
        return res.status(404).json({
          success: false,
          message:
            "Movie not found",
        });
      }

      const reviews =
        await Review.find({
          movie: movie._id,
        })
          .populate(
            "user",
            "name email profilePhoto role"
          )
          .sort({
            createdAt: -1,
          });

      const totalReviews =
        reviews.length;

      const reviewRating =
        totalReviews > 0
          ? reviews.reduce(
              (
                total,
                review
              ) =>
                total +
                review.rating,
              0
            ) /
            totalReviews
          : 0;

      const averageRating =
        totalReviews > 0
          ? Number(
              reviewRating.toFixed(
                1
              )
            )
          : Number(
              movie.initialRating ||
                0
            );

      return res.status(200).json({
        movie,
        reviews,
        averageRating,
      });

    } catch (error) {
      console.error(
        "Get movie details error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch movie details",
      });
    }
  }
);


// ======================================================
// CREATE MOVIE
// ======================================================

router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin access required",
        });
      }

      const movie =
        await Movie.create(
          req.body
        );

      return res.status(201).json({
        success: true,
        message:
          "Movie created successfully",
        movie,
      });

    } catch (error) {
      console.error(
        "Create movie error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create movie",
      });
    }
  }
);


// ======================================================
// UPDATE MOVIE
// ======================================================

router.put(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin access required",
        });
      }

      const movie =
        await Movie.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!movie) {
        return res.status(404).json({
          success: false,
          message:
            "Movie not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Movie updated successfully",
        movie,
      });

    } catch (error) {
      console.error(
        "Update movie error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update movie",
      });
    }
  }
);


// ======================================================
// DELETE MOVIE
// ======================================================

router.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin access required",
        });
      }

      const movie =
        await Movie.findById(
          req.params.id
        );

      if (!movie) {
        return res.status(404).json({
          success: false,
          message:
            "Movie not found",
        });
      }

      // Delete associated reviews
      await Review.deleteMany({
        movie: movie._id,
      });

      await movie.deleteOne();

      return res.status(200).json({
        success: true,
        message:
          "Movie and associated reviews deleted successfully",
      });

    } catch (error) {
      console.error(
        "Delete movie error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete movie",
      });
    }
  }
);


module.exports = router;