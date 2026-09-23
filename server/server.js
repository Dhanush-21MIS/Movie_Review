const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");

const app = express();

// ======================================================
// CONFIGURATION
// ======================================================

const PORT = process.env.PORT || 5000;

const MONGO_URI =
  process.env.MONGO_URI;

const CLIENT_URL =
  process.env.CLIENT_URL ||
  "http://localhost:5173";

// ======================================================
// BASIC VALIDATION
// ======================================================

if (!MONGO_URI) {
  console.error(
    "ERROR: MONGO_URI is missing from server/.env"
  );

  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error(
    "ERROR: JWT_SECRET is missing from server/.env"
  );

  process.exit(1);
}

// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      CLIENT_URL,
    ],

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: true,
  })
);

// ======================================================
// BODY PARSER
// ======================================================

app.use(
  express.json()
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ======================================================
// REQUEST LOGGER
// ======================================================

app.use(
  (req, res, next) => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
    );

    next();
  }
);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
  "/api/health",
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Movie Hub API is running",
      timestamp: new Date().toISOString(),
    });
  }
);

// ======================================================
// API ROUTES
// ======================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/movies",
  movieRoutes
);

app.use(
  "/api/reviews",
  reviewRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

// NEW: Watchlist routes
app.use(
  "/api/watchlist",
  watchlistRoutes
);

// ======================================================
// 404 API HANDLER
// ======================================================

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,
      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "GLOBAL SERVER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
);

// ======================================================
// MONGODB CONNECTION
// ======================================================

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(
      "MongoDB connected successfully"
    );

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          "================================="
        );

        console.log(
          `Movie Hub server running on port ${PORT}`
        );

        console.log(
          `API: http://localhost:${PORT}/api`
        );

        console.log(
          `Health: http://localhost:${PORT}/api/health`
        );

        console.log(
          `Watchlist: http://localhost:${PORT}/api/watchlist`
        );

        console.log(
          "================================="
        );
      }
    );
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error
    );

    process.exit(1);
  });