const express = require("express");

const User = require("../models/User");
const Movie = require("../models/Movie");
const authMiddleware = require("../middleware/AuthMiddleware");

const router = express.Router();

/*
  GET /api/watchlist
  Get current user's watchlist
*/
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: "watchlist",
        model: "Movie",
      })
      .select("watchlist");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      watchlist: user.watchlist || [],
    });
  } catch (error) {
    console.error("Get watchlist error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load watchlist",
    });
  }
});

/*
  GET /api/watchlist/check/:movieId
  Check whether current user has saved a movie
*/
router.get(
  "/check/:movieId",
  authMiddleware,
  async (req, res) => {
    try {
      const { movieId } = req.params;

      const movie = await Movie.findById(movieId);

      if (!movie) {
        return res.status(404).json({
          success: false,
          message: "Movie not found",
        });
      }

      const user = await User.findById(req.user.id)
        .select("watchlist");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const isInWatchlist = user.watchlist.some(
        (id) => String(id) === String(movieId)
      );

      return res.status(200).json({
        success: true,
        isInWatchlist,
      });
    } catch (error) {
      console.error("Check watchlist error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to check watchlist",
      });
    }
  }
);

/*
  POST /api/watchlist/:movieId
  Add movie to watchlist
*/
router.post("/:movieId", authMiddleware, async (req, res) => {
  try {
    const { movieId } = req.params;

    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const alreadyExists = user.watchlist.some(
      (id) => String(id) === String(movieId)
    );

    if (!alreadyExists) {
      user.watchlist.push(movie._id);
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Movie added to watchlist",
      movieId: movie._id,
    });
  } catch (error) {
    console.error("Add watchlist error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add movie to watchlist",
    });
  }
});

/*
  DELETE /api/watchlist/:movieId
  Remove movie from watchlist
*/
router.delete(
  "/:movieId",
  authMiddleware,
  async (req, res) => {
    try {
      const { movieId } = req.params;

      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.watchlist = user.watchlist.filter(
        (id) => String(id) !== String(movieId)
      );

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Movie removed from watchlist",
      });
    } catch (error) {
      console.error("Remove watchlist error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to remove movie from watchlist",
      });
    }
  }
);

module.exports = router;