const mongoose = require("mongoose");

const Movie = require("../models/Movie");
const User = require("../models/User");
const Review = require("../models/Review");


// ======================================================
// DASHBOARD STATISTICS
// ======================================================

const getStats = async (req, res) => {
  try {
    const [
      totalMovies,
      totalUsers,
      totalReviews,
      averageRatingResult,
      mostReviewedMovieResult,
      highestRatedMovieResult,
      mostActiveReviewerResult,
      ratingDistributionResult,
      recentReviews,
      recentUsers,
    ] = await Promise.all([
      Movie.countDocuments(),

      User.countDocuments(),

      Review.countDocuments(),

      Review.aggregate([
        {
          $group: {
            _id: null,
            averageRating: {
              $avg: "$rating",
            },
          },
        },
      ]),

      Review.aggregate([
        {
          $group: {
            _id: "$movie",
            reviewCount: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            reviewCount: -1,
          },
        },
        {
          $limit: 1,
        },
        {
          $lookup: {
            from: "movies",
            localField: "_id",
            foreignField: "_id",
            as: "movie",
          },
        },
        {
          $unwind: {
            path: "$movie",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            reviewCount: 1,
            title: "$movie.title",
            poster: "$movie.poster",
          },
        },
      ]),

      Review.aggregate([
        {
          $group: {
            _id: "$movie",
            averageRating: {
              $avg: "$rating",
            },
            reviewCount: {
              $sum: 1,
            },
          },
        },
        {
          $match: {
            reviewCount: {
              $gt: 0,
            },
          },
        },
        {
          $sort: {
            averageRating: -1,
            reviewCount: -1,
          },
        },
        {
          $limit: 1,
        },
        {
          $lookup: {
            from: "movies",
            localField: "_id",
            foreignField: "_id",
            as: "movie",
          },
        },
        {
          $unwind: {
            path: "$movie",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            averageRating: 1,
            reviewCount: 1,
            title: "$movie.title",
            poster: "$movie.poster",
          },
        },
      ]),

      Review.aggregate([
        {
          $group: {
            _id: "$user",
            reviewCount: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            reviewCount: -1,
          },
        },
        {
          $limit: 1,
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            reviewCount: 1,
            name: "$user.name",
            email: "$user.email",
            profilePhoto:
              "$user.profilePhoto",
          },
        },
      ]),

      Review.aggregate([
        {
          $group: {
            _id: "$rating",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]),

      Review.find()
        .populate(
          "user",
          "name email profilePhoto role"
        )
        .populate(
          "movie",
          "title poster"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5),

      User.find()
        .select(
          "name email profilePhoto role createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5),
    ]);

    const averageRating =
      averageRatingResult.length > 0
        ? Number(
            averageRatingResult[0].averageRating.toFixed(
              1
            )
          )
        : 0;

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratingDistributionResult.forEach(
      (item) => {
        ratingDistribution[item._id] =
          item.count;
      }
    );

    return res.status(200).json({
      success: true,

      stats: {
        totalMovies,
        totalUsers,
        totalReviews,
        averageRating,

        mostReviewedMovie:
          mostReviewedMovieResult[0] ||
          null,

        highestRatedMovie:
          highestRatedMovieResult[0] ||
          null,

        mostActiveReviewer:
          mostActiveReviewerResult[0] ||
          null,

        ratingDistribution,

        recentReviews,

        recentUsers,
      },
    });
  } catch (error) {
    console.error(
      "Get admin stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch dashboard statistics",
    });
  }
};


// ======================================================
// GET ALL MOVIES
// ======================================================

const getMovies = async (req, res) => {
  try {
    const movies =
      await Movie.find().sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      movies,
    });
  } catch (error) {
    console.error(
      "Get admin movies error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch movies",
    });
  }
};


// ======================================================
// CREATE MOVIE
// ======================================================

const createMovie = async (req, res) => {
  try {
    const {
      title,
      description,
      genre,
      releaseYear,
      releaseDate,
      director,
      cast,
      poster,
      initialRating,
      sourceId,
    } = req.body;

    if (
      !title ||
      !String(title).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Movie title is required",
      });
    }

    if (
      !description ||
      !String(description).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Movie description is required",
      });
    }

    const movie =
      await Movie.create({
        title: String(title).trim(),

        description:
          String(description).trim(),

        genre: Array.isArray(genre)
          ? genre
          : [],

        releaseYear:
          releaseYear
            ? Number(releaseYear)
            : undefined,

        releaseDate:
          releaseDate || "",

        director:
          director
            ? String(director).trim()
            : "",

        cast: Array.isArray(cast)
          ? cast
          : [],

        poster:
          poster
            ? String(poster).trim()
            : "",

        initialRating:
          initialRating !== undefined &&
          initialRating !== ""
            ? Number(initialRating)
            : 0,

        sourceId:
          sourceId
            ? String(sourceId).trim()
            : "",
      });

    return res.status(201).json({
      success: true,
      message:
        "Movie created successfully",
      movie,
    });
  } catch (error) {
    console.error(
      "Create admin movie error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create movie",
    });
  }
};


// ======================================================
// UPDATE MOVIE
// ======================================================

const updateMovie = async (req, res) => {
  try {
    const {
      title,
      description,
      genre,
      releaseYear,
      releaseDate,
      director,
      cast,
      poster,
      initialRating,
      sourceId,
    } = req.body;

    if (
      title !== undefined &&
      !String(title).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Movie title cannot be empty",
      });
    }

    if (
      description !== undefined &&
      !String(description).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Movie description cannot be empty",
      });
    }

    const updateData = {};

    if (title !== undefined) {
      updateData.title =
        String(title).trim();
    }

    if (description !== undefined) {
      updateData.description =
        String(description).trim();
    }

    if (genre !== undefined) {
      updateData.genre =
        Array.isArray(genre)
          ? genre
          : [];
    }

    if (releaseYear !== undefined) {
      updateData.releaseYear =
        releaseYear === ""
          ? undefined
          : Number(releaseYear);
    }

    if (releaseDate !== undefined) {
      updateData.releaseDate =
        releaseDate;
    }

    if (director !== undefined) {
      updateData.director =
        String(director).trim();
    }

    if (cast !== undefined) {
      updateData.cast =
        Array.isArray(cast)
          ? cast
          : [];
    }

    if (poster !== undefined) {
      updateData.poster =
        String(poster).trim();
    }

    if (
      initialRating !== undefined
    ) {
      updateData.initialRating =
        initialRating === ""
          ? 0
          : Number(initialRating);
    }

    if (sourceId !== undefined) {
      updateData.sourceId =
        String(sourceId).trim();
    }

    const movie =
      await Movie.findByIdAndUpdate(
        req.params.id,
        updateData,
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
      "Update admin movie error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update movie",
    });
  }
};


// ======================================================
// DELETE MOVIE
// ======================================================

const deleteMovie = async (req, res) => {
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

    // Remove all reviews belonging
    // to the deleted movie.
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
      "Delete admin movie error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete movie",
    });
  }
};


// ======================================================
// GET ALL USERS
// ======================================================

const getUsers = async (req, res) => {
  try {
    const users =
      await User.find()
        .select(
          "name email profilePhoto role createdAt"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(
      "Get admin users error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch users",
    });
  }
};


// ======================================================
// UPDATE USER
// ======================================================

const updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
    } = req.body;

    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    // Prevent an admin from
    // removing their own admin role.
    if (
      req.admin._id.toString() ===
        user._id.toString() &&
      role !== undefined &&
      role !== "admin"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot remove your own admin role",
      });
    }

    if (
      name !== undefined
    ) {
      const cleanName =
        String(name).trim();

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message:
            "Name cannot be empty",
        });
      }

      user.name = cleanName;
    }

    if (
      email !== undefined
    ) {
      const cleanEmail =
        String(email)
          .trim()
          .toLowerCase();

      const existingUser =
        await User.findOne({
          email: cleanEmail,
          _id: {
            $ne: user._id,
          },
        });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "Email is already in use",
        });
      }

      user.email =
        cleanEmail;
    }

    if (
      role !== undefined
    ) {
      if (
        !["user", "admin"].includes(
          role
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user role",
        });
      }

      user.role = role;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "User updated successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto:
          user.profilePhoto,
        role: user.role,
        createdAt:
          user.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Update admin user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update user",
    });
  }
};


// ======================================================
// DELETE USER
// ======================================================

const deleteUser = async (req, res) => {
  try {
    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    // Prevent deleting yourself.
    if (
      req.admin._id.toString() ===
      user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot delete your own account",
      });
    }

    // Delete reviews written
    // by this user.
    await Review.deleteMany({
      user: user._id,
    });

    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "User and associated reviews deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete admin user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete user",
    });
  }
};


// ======================================================
// GET ALL REVIEWS
// ======================================================

const getReviews = async (req, res) => {
  try {
    const reviews =
      await Review.find()
        .populate(
          "user",
          "name email profilePhoto role"
        )
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
      "Get admin reviews error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch reviews",
    });
  }
};


// ======================================================
// DELETE REVIEW
// ======================================================

const deleteReview = async (req, res) => {
  try {
    const review =
      await Review.findById(
        req.params.id
      );

    if (!review) {
      return res.status(404).json({
        success: false,
        message:
          "Review not found",
      });
    }

    await review.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Review deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete admin review error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete review",
    });
  }
};


module.exports = {
  getStats,

  getMovies,
  createMovie,
  updateMovie,
  deleteMovie,

  getUsers,
  updateUser,
  deleteUser,

  getReviews,
  deleteReview,
};