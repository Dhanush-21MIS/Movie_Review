const express = require("express");

const authMiddleware =
  require("../middleware/AuthMiddleware");

const adminMiddleware =
  require("../middleware/AdminMiddleware");

const {
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
} = require("../controllers/adminController");

const router =
  express.Router();


// ======================================================
// ALL ADMIN ROUTES REQUIRE:
// 1. Valid JWT
// 2. Admin role in database
// ======================================================

router.use(authMiddleware);
router.use(adminMiddleware);


// ======================================================
// ADMIN TEST
// ======================================================

router.get(
  "/test",
  (req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "Admin API is working",
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  }
);


// ======================================================
// STATISTICS
// ======================================================

router.get(
  "/stats",
  getStats
);


// ======================================================
// MOVIES
// ======================================================

router.get(
  "/movies",
  getMovies
);

router.post(
  "/movies",
  createMovie
);

router.put(
  "/movies/:id",
  updateMovie
);

router.delete(
  "/movies/:id",
  deleteMovie
);


// ======================================================
// USERS
// ======================================================

router.get(
  "/users",
  getUsers
);

router.put(
  "/users/:id",
  updateUser
);

router.delete(
  "/users/:id",
  deleteUser
);


// ======================================================
// REVIEWS
// ======================================================

router.get(
  "/reviews",
  getReviews
);

router.delete(
  "/reviews/:id",
  deleteReview
);


module.exports = router;