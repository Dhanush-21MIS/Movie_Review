import { useEffect, useState } from "react";
import api from "../api";

const emptyMovie = {
  title: "",
  description: "",
  genre: "",
  releaseYear: "",
  releaseDate: "",
  director: "",
  cast: "",
  poster: "",
  initialRating: "0",
};

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState(null);
  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState("");

  const [showMovieModal, setShowMovieModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieForm, setMovieForm] = useState(emptyMovie);
  const [savingMovie, setSavingMovie] = useState(false);

  const [actionLoading, setActionLoading] = useState("");
  const [roleConfirmationUser, setRoleConfirmationUser] = useState(null);

  const [posterPreviewError, setPosterPreviewError] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);

  // Admin search
  const [movieSearch, setMovieSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [movieSort, setMovieSort] = useState("default");
  const [userSort, setUserSort] = useState("newest");

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === "movies") {
      loadMovies();
    }

    if (activeTab === "users") {
      loadUsers();
    }

    if (activeTab === "reviews") {
      loadReviews();
    }
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/stats");

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load dashboard."
        );
      }

      setStats(response.data.stats || response.data);
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMovies = async () => {
    try {
      setTabLoading(true);

      const response = await api.get("/admin/movies");

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load movies."
        );
      }

      setMovies(
        Array.isArray(response.data.movies) ? response.data.movies : []
      );
    } catch (err) {
      console.error("Movies error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load movies."
      );
    } finally {
      setTabLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setTabLoading(true);

      const response = await api.get("/admin/users");

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load users."
        );
      }

      setUsers(
        Array.isArray(response.data.users) ? response.data.users : []
      );
    } catch (err) {
      console.error("Users error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load users."
      );
    } finally {
      setTabLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      setTabLoading(true);

      const response = await api.get("/admin/reviews");

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load reviews."
        );
      }

      setReviews(
        Array.isArray(response.data.reviews) ? response.data.reviews : []
      );
    } catch (err) {
      console.error("Reviews error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load reviews."
      );
    } finally {
      setTabLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setError("");
    setActiveTab(tab);
  };

  const openCreateMovie = () => {
    setEditingMovie(null);
    setMovieForm(emptyMovie);
    setPosterPreviewError(false);
    setShowMovieModal(true);
  };

  const openEditMovie = (movie) => {
    setEditingMovie(movie);

    setMovieForm({
      title: movie.title || "",
      description: movie.description || "",
      genre: Array.isArray(movie.genre) ? movie.genre.join(", ") : "",
      releaseYear: movie.releaseYear || "",
      releaseDate: movie.releaseDate || "",
      director: movie.director || "",
      cast: Array.isArray(movie.cast) ? movie.cast.join(", ") : "",
      poster: movie.poster || "",
      initialRating: movie.initialRating ?? "0",
    });

    setPosterPreviewError(false);
    setShowMovieModal(true);
  };

  const closeMovieModal = () => {
    if (!savingMovie) {
      setShowMovieModal(false);
      setEditingMovie(null);
      setMovieForm(emptyMovie);
      setPosterPreviewError(false);
    }
  };

  const handleMovieChange = (event) => {
    const { name, value } = event.target;

    setMovieForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "poster") {
      setPosterPreviewError(false);
    }
  };

  const handleMovieSubmit = async (event) => {
    event.preventDefault();

    if (!movieForm.title.trim()) {
      setError("Movie title is required.");
      return;
    }

    if (!movieForm.description.trim()) {
      setError("Movie description is required.");
      return;
    }

    try {
      setSavingMovie(true);
      setError("");

      const payload = {
        title: movieForm.title.trim(),
        description: movieForm.description.trim(),
        genre: movieForm.genre
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        releaseYear: movieForm.releaseYear
          ? Number(movieForm.releaseYear)
          : undefined,
        releaseDate: movieForm.releaseDate.trim(),
        director: movieForm.director.trim(),
        cast: movieForm.cast
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        poster: movieForm.poster.trim(),
        initialRating: movieForm.initialRating
          ? Number(movieForm.initialRating)
          : 0,
      };

      let response;

      if (editingMovie) {
        response = await api.put(
          `/admin/movies/${editingMovie._id}`,
          payload
        );
      } else {
        response = await api.post("/admin/movies", payload);
      }

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to save movie."
        );
      }

      await loadMovies();
      await loadDashboard();

      setShowMovieModal(false);
      setEditingMovie(null);
      setMovieForm(emptyMovie);
      setPosterPreviewError(false);
    } catch (err) {
      console.error("Movie save error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save movie."
      );
    } finally {
      setSavingMovie(false);
    }
  };

  const handleDeleteMovie = (movie) => {
    setDeleteModal({
      type: "movie",
      item: movie,
      title: `Delete ${movie.title}?`,
      message: "This will permanently delete the movie and its associated reviews.",
    });
  };

  const executeDeleteMovie = async (movie) => {
    try {
      setActionLoading(`movie-${movie._id}`);
      setError("");

      const response = await api.delete(`/admin/movies/${movie._id}`);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to delete movie."
        );
      }

      setMovies((previous) =>
        previous.filter(
          (item) => String(item._id) !== String(movie._id)
        )
      );

      await loadDashboard();
    } catch (err) {
      console.error("Movie delete error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to delete movie."
      );
    } finally {
      setActionLoading("");
      setDeleteModal(null);
    }
  };

  const openRoleConfirmation = (user) => {
    if (actionLoading) return;
    setRoleConfirmationUser(user);
  };

  const closeRoleConfirmation = () => {
    if (!actionLoading) {
      setRoleConfirmationUser(null);
    }
  };

  const handleUserRoleChange = async () => {
    if (!roleConfirmationUser) {
      return;
    }

    const user = roleConfirmationUser;
    const newRole = user.role === "admin" ? "user" : "admin";

    try {
      setActionLoading(`role-${user._id}`);
      setError("");

      const response = await api.put(`/admin/users/${user._id}`, {
        role: newRole,
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to update user role."
        );
      }

      setUsers((previous) =>
        previous.map((item) =>
          String(item._id) === String(user._id)
            ? {
                ...item,
                role: newRole,
              }
            : item
        )
      );

      setRoleConfirmationUser(null);
    } catch (err) {
      console.error("Role update error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update user role."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleDeleteUser = (user) => {
    setDeleteModal({
      type: "user",
      item: user,
      title: `Delete ${user.name}?`,
      message: "This user account and its associated data will be permanently deleted.",
    });
  };

  const executeDeleteUser = async (user) => {
    try {
      setActionLoading(`user-${user._id}`);
      setError("");

      const response = await api.delete(`/admin/users/${user._id}`);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to delete user."
        );
      }

      setUsers((previous) =>
        previous.filter(
          (item) => String(item._id) !== String(user._id)
        )
      );

      await loadDashboard();
    } catch (err) {
      console.error("User delete error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to delete user."
      );
    } finally {
      setActionLoading("");
      setDeleteModal(null);
    }
  };

  const handleDeleteReview = (review) => {
    setDeleteModal({
      type: "review",
      item: review,
      title: "Delete this review?",
      message: "This review will be permanently removed from Movie Hub.",
    });
  };

  const executeDeleteReview = async (review) => {
    try {
      setActionLoading(`review-${review._id}`);
      setError("");

      const response = await api.delete(
        `/admin/reviews/${review._id}`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to delete review."
        );
      }

      setReviews((previous) =>
        previous.filter(
          (item) => String(item._id) !== String(review._id)
        )
      );

      await loadDashboard();
    } catch (err) {
      console.error("Review delete error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to delete review."
      );
    } finally {
      setActionLoading("");
      setDeleteModal(null);
    }
  };

  const filteredMovies = movies.filter((movie) => {
    const query = movieSearch.trim().toLowerCase();

    if (!query) return true;

    return [
      movie.title,
      movie.director,
      movie.releaseYear,
      movie.releaseDate,
      ...(Array.isArray(movie.genre) ? movie.genre : []),
      ...(Array.isArray(movie.cast) ? movie.cast : []),
    ]
      .filter(Boolean)
      .some((value) =>
        String(value).toLowerCase().includes(query)
      );
  });

  const filteredUsers = users.filter((user) => {
    const query = userSearch.trim().toLowerCase();

    if (!query) return true;

    return [
      user.name,
      user.email,
      user.role,
    ]
      .filter(Boolean)
      .some((value) =>
        String(value).toLowerCase().includes(query)
      );
  });

  const sortedMovies = [...filteredMovies].sort((a, b) => {
    switch (movieSort) {
      case "title-asc":
        return String(a.title || "").localeCompare(String(b.title || ""));
      case "title-desc":
        return String(b.title || "").localeCompare(String(a.title || ""));
      case "rating-high":
        return getMovieRating(b) - getMovieRating(a);
      case "rating-low":
        return getMovieRating(a) - getMovieRating(b);
      case "reviews-high":
        return (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0);
      case "reviews-low":
        return (Number(a.reviewCount) || 0) - (Number(b.reviewCount) || 0);
      case "newest":
        return new Date(b.releaseDate || b.createdAt || 0) - new Date(a.releaseDate || a.createdAt || 0);
      case "oldest":
        return new Date(a.releaseDate || a.createdAt || 0) - new Date(b.releaseDate || b.createdAt || 0);
      default:
        return 0;
    }
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (userSort) {
      case "name-asc":
        return String(a.name || "").localeCompare(String(b.name || ""));
      case "name-desc":
        return String(b.name || "").localeCompare(String(a.name || ""));
      case "oldest":
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      case "admin-first":
        return (a.role === "admin" ? 0 : 1) - (b.role === "admin" ? 0 : 1);
      case "user-first":
        return (a.role === "user" ? 0 : 1) - (b.role === "user" ? 0 : 1);
      case "newest":
      default:
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatRating = (value) => {
    const rating = Number(value);

    if (!Number.isFinite(rating)) {
      return "0.0";
    }

    return rating.toFixed(1);
  };

  const getStatValue = (key) => {
    if (!stats) return 0;

    return stats[key] ?? 0;
  };

  const getMovieRating = (movie) => {
    return Number(movie.averageRating ?? movie.initialRating ?? 0);
  };

  if (loading) {
    return (
      <section className="admin-page">
        <div className="admin-container">
          <div className="admin-loading">
            <div className="loading-spinner"></div>
            <p>Loading admin dashboard...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <span className="section-eyebrow">ADMINISTRATION</span>

            <h1>Admin Dashboard</h1>

            <p>
              Manage movies, users, reviews, and monitor Movie Hub activity.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadDashboard}
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="admin-error" role="alert">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        <div className="admin-tabs">
          <button
            type="button"
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => handleTabChange("overview")}
          >
            Overview
          </button>

          <button
            type="button"
            className={activeTab === "movies" ? "active" : ""}
            onClick={() => handleTabChange("movies")}
          >
            Movies
          </button>

          <button
            type="button"
            className={activeTab === "users" ? "active" : ""}
            onClick={() => handleTabChange("users")}
          >
            Users
          </button>

          <button
            type="button"
            className={activeTab === "reviews" ? "active" : ""}
            onClick={() => handleTabChange("reviews")}
          >
            Reviews
          </button>
        </div>

        {activeTab === "overview" && (
          <>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <span className="admin-stat-label">Total Movies</span>
                <strong>{getStatValue("totalMovies")}</strong>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Total Users</span>
                <strong>{getStatValue("totalUsers")}</strong>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Total Reviews</span>
                <strong>{getStatValue("totalReviews")}</strong>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Average Rating</span>
                <strong>
                  {formatRating(getStatValue("averageRating"))}
                </strong>
              </div>
            </div>

            <div className="admin-overview-grid">
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <span className="section-eyebrow">MOVIES</span>
                    <h2>Top Movie Activity</h2>
                  </div>
                </div>

                <div className="admin-highlight-list">
                  <div className="admin-highlight">
                    <span>Most Reviewed</span>
                    <strong>
                      {stats?.mostReviewedMovie?.title || "No data"}
                    </strong>
                  </div>

                  <div className="admin-highlight">
                    <span>Highest Rated</span>
                    <strong>
                      {stats?.highestRatedMovie?.title || "No data"}
                    </strong>
                  </div>

                  <div className="admin-highlight">
                    <span>Most Active Reviewer</span>
                    <strong>
                      {stats?.mostActiveReviewer?.name || "No data"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <span className="section-eyebrow">RATINGS</span>
                    <h2>Rating Distribution</h2>
                  </div>
                </div>

                <div className="rating-distribution">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const distribution =
                      stats?.ratingDistribution || {};

                    const count =
                      distribution[rating] ??
                      distribution[String(rating)] ??
                      0;

                    const total = getStatValue("totalReviews");

                    const percentage =
                      total > 0 ? (count / total) * 100 : 0;

                    return (
                      <div className="rating-row" key={rating}>
                        <span>{rating} ★</span>

                        <div className="rating-bar">
                          <div
                            className="rating-bar-fill"
                            style={{
                              width: `${percentage}%`,
                            }}
                          ></div>
                        </div>

                        <strong>{count}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="admin-overview-grid">
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <span className="section-eyebrow">RECENT</span>
                    <h2>Recent Reviews</h2>
                  </div>
                </div>

                {Array.isArray(stats?.recentReviews) &&
                stats.recentReviews.length > 0 ? (
                  <div className="admin-recent-list">
                    {stats.recentReviews.slice(0, 5).map((review) => (
                      <div
                        className="admin-recent-item"
                        key={review._id}
                      >
                        <div>
                          <strong>
                            {review.user?.name || "User"}
                          </strong>

                          <span>
                            {review.movie?.title || "Movie"}
                          </span>
                        </div>

                        <span className="admin-review-rating">
                          ★ {formatRating(review.rating)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="admin-no-data">No recent reviews.</p>
                )}
              </div>

              <div className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <span className="section-eyebrow">NEW MEMBERS</span>
                    <h2>Recent Users</h2>
                  </div>
                </div>

                {Array.isArray(stats?.recentUsers) &&
                stats.recentUsers.length > 0 ? (
                  <div className="admin-recent-list">
                    {stats.recentUsers.slice(0, 5).map((user) => (
                      <div
                        className="admin-recent-item"
                        key={user._id}
                      >
                        <div className="admin-user-summary">
                          {user.profilePhoto ? (
                            <img
                              src={user.profilePhoto}
                              alt=""
                              className="admin-user-avatar"
                            />
                          ) : (
                            <div className="admin-user-avatar admin-avatar-fallback">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div>
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                          </div>
                        </div>

                        <small>{formatDate(user.createdAt)}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="admin-no-data">No recent users.</p>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "movies" && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <span className="section-eyebrow">CATALOG</span>
                <h2>Manage Movies</h2>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={openCreateMovie}
              >
                + Add Movie
              </button>
            </div>

            <div className="admin-search-row">
              <div className="admin-search-box">
                <span className="admin-search-icon">⌕</span>
                <input
                  type="search"
                  value={movieSearch}
                  onChange={(event) => setMovieSearch(event.target.value)}
                  placeholder="Search movies by title, director, genre or year..."
                  aria-label="Search movies"
                />
                {movieSearch && (
                  <button
                    type="button"
                    className="admin-search-clear"
                    onClick={() => setMovieSearch("")}
                    aria-label="Clear movie search"
                  >
                    ×
                  </button>
                )}
              </div>
              <span className="admin-search-count">
                {filteredMovies.length} of {movies.length} movies
              </span>
              <select
                className="admin-sort-select"
                value={movieSort}
                onChange={(event) => setMovieSort(event.target.value)}
                aria-label="Sort movies"
              >
                <option value="default">Sort: Default</option>
                <option value="title-asc">Title A → Z</option>
                <option value="title-desc">Title Z → A</option>
                <option value="rating-high">Highest Rated</option>
                <option value="rating-low">Lowest Rated</option>
                <option value="reviews-high">Most Reviews</option>
                <option value="reviews-low">Least Reviews</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>

            {tabLoading ? (
              <div className="admin-tab-loading">
                <div className="loading-spinner"></div>
                <p>Loading movies...</p>
              </div>
            ) : movies.length === 0 ? (
              <div className="admin-no-data-large">
                <h3>No movies found</h3>
                <p>Add your first movie to the catalog.</p>
              </div>
            ) : filteredMovies.length === 0 ? (
              <div className="admin-no-data-large">
                <h3>No matching movies</h3>
                <p>Try a different movie search.</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Movie</th>
                      <th>Year</th>
                      <th>Rating</th>
                      <th>Reviews</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedMovies.map((movie) => (
                      <tr key={movie._id}>
                        <td>
                          <div className="admin-movie-cell">
                            {movie.poster ? (
                              <img
                                src={movie.poster}
                                alt=""
                                className="admin-movie-thumb"
                              />
                            ) : (
                              <div className="admin-movie-thumb admin-thumb-fallback">
                                M
                              </div>
                            )}

                            <div>
                              <strong>{movie.title}</strong>
                              <span>
                                {movie.director || "Director not listed"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {movie.releaseYear ||
                            (movie.releaseDate
                              ? new Date(
                                  movie.releaseDate
                                ).getFullYear()
                              : "N/A")}
                        </td>

                        <td>
                          <span className="admin-rating">
                            ★ {formatRating(getMovieRating(movie))}
                          </span>
                        </td>

                        <td>
                          {Array.isArray(movie.reviews)
                            ? movie.reviews.length
                            : movie.reviewCount ?? 0}
                        </td>

                        <td>
                          <div className="admin-action-buttons">
                            <button
                              type="button"
                              className="table-action-button"
                              onClick={() => openEditMovie(movie)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="table-action-button danger"
                              onClick={() => handleDeleteMovie(movie)}
                              disabled={
                                actionLoading === `movie-${movie._id}`
                              }
                            >
                              {actionLoading === `movie-${movie._id}`
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <span className="section-eyebrow">MEMBERS</span>
                <h2>Manage Users</h2>
              </div>

              <span className="admin-count-badge">
                {users.length} users
              </span>
            </div>

            <div className="admin-search-row">
              <div className="admin-search-box">
                <span className="admin-search-icon">⌕</span>
                <input
                  type="search"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Search users by name, email or role..."
                  aria-label="Search users"
                />
                {userSearch && (
                  <button
                    type="button"
                    className="admin-search-clear"
                    onClick={() => setUserSearch("")}
                    aria-label="Clear user search"
                  >
                    ×
                  </button>
                )}
              </div>
              <span className="admin-search-count">
                {filteredUsers.length} of {users.length} users
              </span>
              <select
                className="admin-sort-select"
                value={userSort}
                onChange={(event) => setUserSort(event.target.value)}
                aria-label="Sort users"
              >
                <option value="newest">Newest Users</option>
                <option value="oldest">Oldest Users</option>
                <option value="name-asc">Name A → Z</option>
                <option value="name-desc">Name Z → A</option>
                <option value="admin-first">Admins First</option>
                <option value="user-first">Users First</option>
              </select>
            </div>

            {tabLoading ? (
              <div className="admin-tab-loading">
                <div className="loading-spinner"></div>
                <p>Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="admin-no-data-large">
                <h3>No users found</h3>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="admin-no-data-large">
                <h3>No matching users</h3>
                <p>Try a different user search.</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedUsers.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <div className="admin-user-cell">
                            {user.profilePhoto ? (
                              <img
                                src={user.profilePhoto}
                                alt=""
                                className="admin-user-avatar"
                              />
                            ) : (
                              <div className="admin-user-avatar admin-avatar-fallback">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div>
                              <strong>{user.name}</strong>
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`role-badge ${
                              user.role === "admin"
                                ? "admin-role"
                                : "user-role"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        <td>{formatDate(user.createdAt)}</td>

                        <td>
                          <div className="admin-action-buttons">
                            <button
                              type="button"
                              className="table-action-button"
                              onClick={() =>
                                openRoleConfirmation(user)
                              }
                              disabled={
                                actionLoading === `role-${user._id}`
                              }
                            >
                              {actionLoading === `role-${user._id}`
                                ? "Updating..."
                                : user.role === "admin"
                                ? "Make User"
                                : "Make Admin"}
                            </button>

                            <button
                              type="button"
                              className="table-action-button danger"
                              onClick={() =>
                                handleDeleteUser(user)
                              }
                              disabled={
                                actionLoading === `user-${user._id}`
                              }
                            >
                              {actionLoading === `user-${user._id}`
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <span className="section-eyebrow">COMMUNITY</span>
                <h2>Manage Reviews</h2>
              </div>

              <span className="admin-count-badge">
                {reviews.length} reviews
              </span>
            </div>

            {tabLoading ? (
              <div className="admin-tab-loading">
                <div className="loading-spinner"></div>
                <p>Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="admin-no-data-large">
                <h3>No reviews found</h3>
              </div>
            ) : (
              <div className="admin-review-list">
                {reviews.map((review) => (
                  <div className="admin-review-card" key={review._id}>
                    <div className="admin-review-user">
                      {review.user?.profilePhoto ? (
                        <img
                          src={review.user.profilePhoto}
                          alt=""
                          className="admin-user-avatar"
                        />
                      ) : (
                        <div className="admin-user-avatar admin-avatar-fallback">
                          {review.user?.name
                            ?.charAt(0)
                            .toUpperCase() || "U"}
                        </div>
                      )}

                      <div>
                        <strong>
                          {review.user?.name || "Unknown User"}
                        </strong>

                        <span>
                          {review.user?.email || ""}
                        </span>
                      </div>
                    </div>

                    <div className="admin-review-main">
                      <div className="admin-review-movie-title">
                        {review.movie?.title || "Unknown Movie"}
                      </div>

                      <div className="admin-review-stars">
                        {"★".repeat(Number(review.rating) || 0)}
                        <span>
                          {formatRating(review.rating)}/5
                        </span>
                      </div>

                      <p>{review.comment}</p>

                      <small>
                        {formatDate(review.createdAt)}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="table-action-button danger"
                      onClick={() => handleDeleteReview(review)}
                      disabled={
                        actionLoading === `review-${review._id}`
                      }
                    >
                      {actionLoading === `review-${review._id}`
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {roleConfirmationUser && (
        <div
          className="admin-role-confirm-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeRoleConfirmation();
            }
          }}
        >
          <div
            className="admin-role-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-role-confirm-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-role-confirm-icon" aria-hidden="true">
              {roleConfirmationUser.role === "admin" ? "U" : "A"}
            </div>

            <div className="admin-role-confirm-content">
              <span className="section-eyebrow">USER ROLE</span>

              <h2 id="admin-role-confirm-title">
                {roleConfirmationUser.role === "admin"
                  ? "Remove admin access?"
                  : "Make this user an admin?"}
              </h2>

              <p>
                You are about to change{" "}
                <strong>{roleConfirmationUser.name}</strong>'s role from{" "}
                <strong>{roleConfirmationUser.role}</strong> to{" "}
                <strong>
                  {roleConfirmationUser.role === "admin" ? "user" : "admin"}
                </strong>.
              </p>
            </div>

            <div className="admin-role-confirm-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeRoleConfirmation}
                disabled={Boolean(actionLoading)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={handleUserRoleChange}
                disabled={Boolean(actionLoading)}
              >
                {actionLoading === `role-${roleConfirmationUser._id}`
                  ? "Updating..."
                  : roleConfirmationUser.role === "admin"
                  ? "Remove Admin"
                  : "Make Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div
          className="admin-confirm-overlay"
          onMouseDown={() => {
            if (!actionLoading) setDeleteModal(null);
          }}
        >
          <div
            className="admin-confirm-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-confirm-icon">!</div>

            <div className="admin-confirm-content">
              <span className="section-eyebrow">CONFIRM ACTION</span>
              <h2>{deleteModal.title}</h2>
              <p>{deleteModal.message}</p>
              <small>This action cannot be undone.</small>
            </div>

            <div className="admin-confirm-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeleteModal(null)}
                disabled={Boolean(actionLoading)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-button"
                disabled={Boolean(actionLoading)}
                onClick={() => {
                  if (deleteModal.type === "movie") {
                    executeDeleteMovie(deleteModal.item);
                  } else if (deleteModal.type === "user") {
                    executeDeleteUser(deleteModal.item);
                  } else {
                    executeDeleteReview(deleteModal.item);
                  }
                }}
              >
                {actionLoading ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMovieModal && (
        <div
          className="admin-modal-overlay"
          onMouseDown={closeMovieModal}
        >
          <div
            className="admin-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <span className="section-eyebrow">
                  {editingMovie ? "EDIT" : "CATALOG"}
                </span>

                <h2>
                  {editingMovie ? "Edit Movie" : "Add Movie"}
                </h2>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={closeMovieModal}
                disabled={savingMovie}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              className="admin-movie-form"
              onSubmit={handleMovieSubmit}
            >
              <div className="admin-form-grid">
                <div className="admin-form-field admin-form-field-full">
                  <label htmlFor="title">Movie Title *</label>

                  <input
                    id="title"
                    name="title"
                    value={movieForm.title}
                    onChange={handleMovieChange}
                    placeholder="Enter movie title"
                    required
                    disabled={savingMovie}
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="director">Director</label>

                  <input
                    id="director"
                    name="director"
                    value={movieForm.director}
                    onChange={handleMovieChange}
                    placeholder="Director name"
                    disabled={savingMovie}
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="releaseYear">Release Year</label>

                  <input
                    id="releaseYear"
                    name="releaseYear"
                    type="number"
                    value={movieForm.releaseYear}
                    onChange={handleMovieChange}
                    placeholder="2026"
                    disabled={savingMovie}
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="releaseDate">Release Date</label>

                  <input
                    id="releaseDate"
                    name="releaseDate"
                    type="date"
                    value={movieForm.releaseDate}
                    onChange={handleMovieChange}
                    disabled={savingMovie}
                  />
                </div>

                <div className="admin-form-field">
                  <label htmlFor="initialRating">
                    Initial Rating
                  </label>

                  <input
                    id="initialRating"
                    name="initialRating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={movieForm.initialRating}
                    onChange={handleMovieChange}
                    disabled={savingMovie}
                  />
                </div>

                <div className="admin-form-field admin-form-field-full">
                  <label htmlFor="genre">
                    Genres
                  </label>

                  <input
                    id="genre"
                    name="genre"
                    value={movieForm.genre}
                    onChange={handleMovieChange}
                    placeholder="Action, Drama, Thriller"
                    disabled={savingMovie}
                  />

                  <small>
                    Separate multiple genres with commas.
                  </small>
                </div>

                <div className="admin-form-field admin-form-field-full">
                  <label htmlFor="cast">Cast</label>

                  <input
                    id="cast"
                    name="cast"
                    value={movieForm.cast}
                    onChange={handleMovieChange}
                    placeholder="Actor One, Actor Two"
                    disabled={savingMovie}
                  />

                  <small>
                    Separate multiple cast members with commas.
                  </small>
                </div>

                <div className="admin-form-field admin-form-field-full">
                  <label htmlFor="poster">Poster URL</label>

                  <input
                    id="poster"
                    name="poster"
                    type="url"
                    value={movieForm.poster}
                    onChange={handleMovieChange}
                    placeholder="https://..."
                    disabled={savingMovie}
                  />

                  <div className="admin-poster-preview">
                    {movieForm.poster.trim() && !posterPreviewError ? (
                      <img
                        src={movieForm.poster.trim()}
                        alt="Movie poster preview"
                        onError={() => setPosterPreviewError(true)}
                      />
                    ) : (
                      <div className="admin-poster-preview-empty">
                        <span>Poster Preview</span>
                        <small>Paste a valid poster URL above</small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-form-field admin-form-field-full">
                  <label htmlFor="description">
                    Description *
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    value={movieForm.description}
                    onChange={handleMovieChange}
                    placeholder="Write a description of the movie..."
                    rows="6"
                    required
                    disabled={savingMovie}
                  />
                </div>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeMovieModal}
                  disabled={savingMovie}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingMovie}
                >
                  {savingMovie
                    ? "Saving..."
                    : editingMovie
                    ? "Update Movie"
                    : "Add Movie"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminDashboard;