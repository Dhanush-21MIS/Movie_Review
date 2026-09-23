import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";

function Moviedetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [deleteReviewId, setDeleteReviewId] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  /*
   * Get currently logged-in user from localStorage.
   */
  const storedUser = useMemo(() => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Failed to read stored user:", error);
      return null;
    }
  }, []);

  const isAuthenticated = Boolean(
    localStorage.getItem("token")
  );

  /*
   * =========================================================
   * FETCH MOVIE DETAILS
   * =========================================================
   *
   * Backend response:
   *
   * {
   *   movie: {...},
   *   reviews: [...],
   *   averageRating: 4.5
   * }
   */
  useEffect(() => {
    let mounted = true;

    const fetchMovie = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/movies/${id}`);

        if (!mounted) return;

        const data = response.data;

        /*
         * IMPORTANT:
         * Your backend does NOT return:
         *
         * {
         *   success: true
         * }
         *
         * Therefore, do not check response.data.success.
         */

        if (!data?.movie) {
          throw new Error(
            data?.message ||
              "Unable to load movie details."
          );
        }

        setMovie(data.movie);

        /*
         * Reviews are returned separately
         * from the movie object.
         */
        setReviews(
          Array.isArray(data.reviews)
            ? data.reviews
            : []
        );

        /*
         * Average rating is also returned
         * separately by the backend.
         */
        const backendRating = Number(
          data.averageRating
        );

        const initialRating = Number(
          data.movie.initialRating
        );

        if (
          Number.isFinite(backendRating)
        ) {
          setAverageRating(
            backendRating
          );
        } else if (
          Number.isFinite(initialRating)
        ) {
          setAverageRating(
            initialRating
          );
        } else {
          setAverageRating(0);
        }
      } catch (err) {
        if (!mounted) return;

        console.error(
          "Failed to fetch movie:",
          err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load movie details."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchMovie();
    } else {
      setLoading(false);
      setError("Movie ID is missing.");
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  /*
   * Lock the background page while the review dialog is open.
   * The user sees the review form first and cannot scroll the
   * movie page underneath it.
   */
  useEffect(() => {
    const dialogOpen =
      showReviewForm || Boolean(deleteReviewId);

    if (!dialogOpen) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showReviewForm, deleteReviewId]);

  /*
   * =========================================================
   * HELPER FUNCTIONS
   * =========================================================
   */

  const getMovieRating = () => {
    const ratingValue = Number(
      averageRating ??
        movie?.averageRating ??
        movie?.initialRating ??
        0
    );

    return Number.isFinite(ratingValue)
      ? ratingValue
      : 0;
  };

  const formatRating = (value) => {
    const numericValue = Number(value);

    if (
      !Number.isFinite(numericValue) ||
      numericValue <= 0
    ) {
      return "0.0";
    }

    return numericValue.toFixed(1);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getInitial = (name) => {
    if (!name) {
      return "U";
    }

    return name
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  const getUserId = (user) => {
    if (!user) {
      return null;
    }

    if (typeof user === "string") {
      return user;
    }

    return (
      user._id ||
      user.id ||
      null
    );
  };

  const isReviewOwner = (review) => {
    const currentUserId =
      getUserId(storedUser);

    const reviewUserId =
      getUserId(review?.user);

    if (
      !currentUserId ||
      !reviewUserId
    ) {
      return false;
    }

    return (
      String(currentUserId) ===
      String(reviewUserId)
    );
  };

  /*
   * =========================================================
   * RATING SELECTION
   * =========================================================
   */

  const handleRatingClick = (value) => {
    setRating(value);
    setReviewError("");
    setReviewSuccess("");
  };

  /*
   * =========================================================
   * SUBMIT REVIEW
   * =========================================================
   */

  const handleSubmitReview = async (
    event
  ) => {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!rating) {
      setReviewError(
        "Please select a rating."
      );
      return;
    }

    if (!comment.trim()) {
      setReviewError(
        "Please write a review comment."
      );
      return;
    }

    if (comment.trim().length < 3) {
      setReviewError(
        "Your review must contain at least 3 characters."
      );
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError("");
      setReviewSuccess("");

      const response = await api.post(
        `/reviews/${id}`,
        {
          rating,
          comment: comment.trim(),
        }
      );

      const data = response.data;

      /*
       * Support both:
       *
       * {
       *   success: true,
       *   review: {...}
       * }
       *
       * and a direct review object.
       */
      if (data?.success === false) {
        throw new Error(
          data?.message ||
            "Unable to submit your review."
        );
      }

      const newReview =
        data?.review ||
        (data?._id ? data : null);

      if (newReview) {
        setReviews(
          (previousReviews) => [
            newReview,
            ...previousReviews.filter(
              (existingReview) =>
                String(
                  existingReview._id
                ) !==
                String(newReview._id)
            ),
          ]
        );
      }

      setRating(0);
      setHoverRating(0);
      setComment("");

      setReviewSuccess(
        data?.message ||
          "Your review was added successfully."
      );

      /*
       * Refresh complete movie details.
       *
       * This updates:
       * - average rating
       * - review count
       * - review list
       */
      const movieResponse =
        await api.get(
          `/movies/${id}`
        );

      const refreshedData =
        movieResponse.data;

      if (refreshedData?.movie) {
        setMovie(
          refreshedData.movie
        );

        setReviews(
          Array.isArray(
            refreshedData.reviews
          )
            ? refreshedData.reviews
            : []
        );

        const refreshedRating =
          Number(
            refreshedData.averageRating
          );

        if (
          Number.isFinite(
            refreshedRating
          )
        ) {
          setAverageRating(
            refreshedRating
          );
        } else {
          setAverageRating(
            Number(
              refreshedData.movie
                .initialRating
            ) || 0
          );
        }
      }

      // Close the review form after a successful submission.
      setShowReviewForm(false);
      setReviewSuccess("");
    } catch (err) {
      console.error(
        "Failed to submit review:",
        err
      );

      if (
        err.response?.status === 401
      ) {
        setReviewError(
          "Your session has expired. Please login again."
        );
      } else {
        setReviewError(
          err.response?.data?.message ||
            err.message ||
            "Unable to submit your review."
        );
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  /*
   * =========================================================
   * DELETE REVIEW
   * =========================================================
   */

  const handleDeleteReview = (reviewId) => {
    setReviewError("");
    setReviewSuccess("");
    setDeleteReviewId(reviewId);
  };

  const closeDeleteReview = () => {
    if (deletingReviewId) return;
    setDeleteReviewId(null);
    setReviewError("");
  };

  const confirmDeleteReview = async () => {
    if (!deleteReviewId) return;

    try {
      setDeletingReviewId(deleteReviewId);
      setReviewError("");
      setReviewSuccess("");

      const response = await api.delete(
        `/reviews/${deleteReviewId}`
      );

      const data = response.data;

      if (data?.success === false) {
        throw new Error(
          data?.message ||
            "Unable to delete the review."
        );
      }

      setReviews((previousReviews) =>
        previousReviews.filter(
          (review) =>
            String(review._id) !==
            String(deleteReviewId)
        )
      );

      setReviewSuccess(
        data?.message ||
          "Your review has been deleted."
      );

      setDeleteReviewId(null);

      const movieResponse = await api.get(
        `/movies/${id}`
      );

      const refreshedData =
        movieResponse.data;

      if (refreshedData?.movie) {
        setMovie(refreshedData.movie);

        setReviews(
          Array.isArray(refreshedData.reviews)
            ? refreshedData.reviews
            : []
        );

        const refreshedRating = Number(
          refreshedData.averageRating
        );

        if (
          Number.isFinite(refreshedRating)
        ) {
          setAverageRating(
            refreshedRating
          );
        } else {
          setAverageRating(
            Number(
              refreshedData.movie.initialRating
            ) || 0
          );
        }
      }
    } catch (err) {
      console.error(
        "Failed to delete review:",
        err
      );

      setReviewError(
        err.response?.data?.message ||
          err.message ||
          "Unable to delete the review."
      );
    } finally {
      setDeletingReviewId(null);
    }
  };

  /*
   * =========================================================
   * STAR COMPONENT
   * =========================================================
   */

  const renderStars = (
    value,
    interactive = false
  ) => {
    const numericValue =
      Number(value) || 0;

    return (
      <div
        className={`star-rating ${
          interactive
            ? "star-rating-interactive"
            : ""
        }`}
        aria-label={`${numericValue} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map(
          (star) => (
            <button
              key={star}
              type="button"
              className={`star-button ${
                star <= numericValue
                  ? "star-filled"
                  : "star-empty"
              }`}
              onClick={
                interactive
                  ? () =>
                      handleRatingClick(
                        star
                      )
                  : undefined
              }
              onMouseEnter={
                interactive
                  ? () =>
                      setHoverRating(
                        star
                      )
                  : undefined
              }
              onMouseLeave={
                interactive
                  ? () =>
                      setHoverRating(0)
                  : undefined
              }
              disabled={
                !interactive ||
                submittingReview
              }
              aria-label={`${star} star${
                star > 1
                  ? "s"
                  : ""
              }`}
            >
              ★
            </button>
          )
        )}
      </div>
    );
  };

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <section className="movie-details-page">
        <div className="movie-details-container">
          <div className="movie-details-loading">
            <div className="loading-spinner"></div>

            <p>
              Loading movie details...
            </p>
          </div>
        </div>
      </section>
    );
  }

  /*
   * =========================================================
   * ERROR
   * =========================================================
   */

  if (error || !movie) {
    return (
      <section className="movie-details-page">
        <div className="movie-details-container">
          <div className="movie-details-error">

            <div className="error-icon">
              !
            </div>

            <h1>
              Movie Not Found
            </h1>

            <p>
              {error ||
                "The requested movie could not be found."}
            </p>

            <Link
              to="/"
              className="primary-button"
            >
              Back to Movies
            </Link>

          </div>
        </div>
      </section>
    );
  }

  /*
   * =========================================================
   * MOVIE INFORMATION
   * =========================================================
   */

  const movieRating =
    getMovieRating();

  const releaseYear =
    movie.releaseYear ||
    (movie.releaseDate
      ? new Date(
          movie.releaseDate
        ).getFullYear()
      : "N/A");

  const genres = Array.isArray(
    movie.genre
  )
    ? movie.genre
    : [];

  const cast = Array.isArray(
    movie.cast
  )
    ? movie.cast
    : [];

  const displayedRating =
    hoverRating || rating;

  const userReview = reviews.find((review) =>
    isReviewOwner(review)
  );

  const hasUserReviewed = Boolean(userReview);

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <section className="movie-details-page">
      <div className="movie-details-container">

        {/* BACK TO MOVIES */}
        <Link to="/" className="back-to-movies">
          ← Back to Movies
        </Link>

        {/* =================================================
            TOP WRITE REVIEW CTA
        ================================================= */}
        <section className="top-write-review-bar">
          <div className="top-write-review-copy">
            <span className="section-eyebrow">
              {hasUserReviewed ? "YOUR REVIEW" : "YOUR OPINION"}
            </span>

            <div className="top-write-review-title">
              <h2>
                {hasUserReviewed
                  ? "You have already reviewed this movie"
                  : `Share your thoughts about ${movie.title}`}
              </h2>

              <p>
                {hasUserReviewed
                  ? "You can delete your review from the community section."
                  : "Be the first to share your rating and review with the community."}
              </p>
            </div>
          </div>

          {hasUserReviewed ? (
            <div className="top-write-review-button already-reviewed-button">
              <span className="write-review-icon">✓</span>
              Already Reviewed
            </div>
          ) : (
            <button
              type="button"
              className="top-write-review-button"
              onClick={() => {
                if (!isAuthenticated) {
                  navigate("/login");
                  return;
                }

                setRating(0);
                setHoverRating(0);
                setComment("");
                setReviewError("");
                setReviewSuccess("");
                setShowReviewForm(true);
              }}
            >
              <span className="write-review-icon">✎</span>
              Write a Review
            </button>
          )}
        </section>

        {/* =================================================
            DESKTOP TWO-COLUMN LAYOUT
        ================================================= */}
        <div className="movie-details-layout">

          {/* =================================================
              LEFT COLUMN — MOVIE DETAILS + YOUR OPINION
          ================================================= */}
          <div className="movie-details-main-column">

            {/* MOVIE INFORMATION */}
            <div className="movie-details-main">

              {/* POSTER */}
              <div className="movie-details-poster-section">
                {movie.poster ? (
                  <img
                    src={movie.poster}
                    alt={`${movie.title} poster`}
                    className="movie-details-poster"
                  />
                ) : (
                  <div className="movie-details-poster-placeholder">
                    <span>Movie Hub</span>
                  </div>
                )}
              </div>

              {/* CONTENT */}
              <div className="movie-details-content">

                {/* TITLE + RATING */}
                <div className="movie-details-heading">
                  <div className="movie-details-title-block">
                    <span className="section-eyebrow">
                      MOVIE
                    </span>

                    <h1>{movie.title}</h1>
                  </div>

                  <div className="movie-details-rating">
                    <span className="large-rating-star">★</span>

                    <div>
                      <strong>{formatRating(movieRating)}</strong>
                      <span>
                        {reviews.length === 1
                          ? "1 review"
                          : `${reviews.length} reviews`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* META */}
                <div className="movie-details-meta">
                  <span>{releaseYear}</span>

                  {movie.director && (
                    <>
                      <span className="meta-divider">•</span>
                      <span>Directed by {movie.director}</span>
                    </>
                  )}
                </div>

                {/* GENRES */}
                {genres.length > 0 && (
                  <div className="movie-details-genres">
                    {genres.map((genre) => (
                      <span className="movie-genre" key={genre}>
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* DESCRIPTION */}
                <div className="movie-details-description">
                  <h2>About this movie</h2>

                  <p>
                    {movie.description || "No description available."}
                  </p>
                </div>

                {/* CAST */}
                {cast.length > 0 && (
                  <div className="movie-cast">
                    <h2>Cast</h2>

                    <div className="cast-list">
                      {cast.map((actor, index) => (
                        <span
                          className="cast-item"
                          key={`${actor}-${index}`}
                        >
                          {actor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* MOVIE INFORMATION GRID */}
                <div className="movie-details-info-grid">
                  <div className="movie-info-item">
                    <span>DIRECTOR</span>
                    <strong>{movie.director || "N/A"}</strong>
                  </div>

                  <div className="movie-info-item">
                    <span>RELEASE YEAR</span>
                    <strong>{releaseYear}</strong>
                  </div>

                  <div className="movie-info-item">
                    <span>GENRE</span>
                    <strong>
                      {genres.length > 0
                        ? genres.join(", ")
                        : "N/A"}
                    </strong>
                  </div>

                  <div className="movie-info-item">
                    <span>RELEASE DATE</span>
                    <strong>
                      {movie.releaseDate
                        ? formatDate(movie.releaseDate)
                        : "N/A"}
                    </strong>
                  </div>
                </div>

              </div>
            </div>

            {/* =================================================
                WRITE REVIEW MODAL
            ================================================= */}
            {showReviewForm && isAuthenticated && (
              <div
                className="review-modal-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="review-modal-title"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget && !submittingReview) {
                    setShowReviewForm(false);
                    setReviewError("");
                  }
                }}
              >
                <div className="review-modal-card">

                  <div className="review-modal-header">
                    <div>
                      <span className="section-eyebrow">
                        YOUR OPINION
                      </span>

                      <h2 id="review-modal-title">
                        Write a Review
                      </h2>

                      <p>
                        Share your thoughts about {movie.title}.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="review-modal-close"
                      aria-label="Close review form"
                      disabled={submittingReview}
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewError("");
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {reviewError && (
                    <div className="review-message review-message-error">
                      {reviewError}
                    </div>
                  )}

                  <form onSubmit={handleSubmitReview}>

                    <div className="review-rating-field">
                      <label>Your Rating</label>

                      <div className="review-rating-input-row">
                        {renderStars(displayedRating, true)}

                        <span className="selected-rating">
                          {displayedRating
                            ? `${displayedRating}/5`
                            : "Select a rating"}
                        </span>
                      </div>
                    </div>

                    <div className="review-comment-field">
                      <label htmlFor="review-comment">
                        Your Review
                      </label>

                      <textarea
                        id="review-comment"
                        value={comment}
                        onChange={(event) => {
                          setComment(event.target.value);
                          setReviewError("");
                          setReviewSuccess("");
                        }}
                        placeholder="Write your thoughts about this movie..."
                        rows="6"
                        maxLength="1000"
                        autoFocus
                        disabled={submittingReview}
                      />

                      <div className="review-character-count">
                        {comment.length}/1000
                      </div>
                    </div>

                    <div className="review-modal-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={submittingReview}
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewError("");
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="primary-button review-submit-button"
                        disabled={submittingReview}
                      >
                        {submittingReview
                          ? "Submitting..."
                          : "Submit Review"}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

          </div>

          {/* =================================================
              RIGHT COLUMN — COMMUNITY REVIEWS
          ================================================= */}
          <aside className="movie-reviews-sidebar">

            <div className="movie-reviews-card">

              {/* HEADER */}
              <div className="movie-reviews-header">
                <div>
                  <span className="section-eyebrow">
                    COMMUNITY
                  </span>

                  <h2>User Reviews</h2>
                </div>

                <span className="review-count">
                  {reviews.length}
                </span>
              </div>

              {/* RATING SUMMARY */}
              <div className="movie-reviews-summary">

                <strong>
                  {formatRating(movieRating)}
                </strong>

                <div className="movie-reviews-summary-details">
                  <div className="movie-reviews-summary-stars">
                    {renderStars(movieRating)}
                  </div>

                  <span>
                    {reviews.length === 0
                      ? "No reviews yet"
                      : reviews.length === 1
                        ? "Average rating"
                        : "Average rating"}
                  </span>
                </div>

              </div>

              {/* REVIEW LIST */}
              <div className="sidebar-reviews-list">

                {reviews.length === 0 ? (
                  <div className="sidebar-no-reviews">
                    <div className="empty-icon">★</div>

                    <h3>No reviews yet</h3>

                    <p>
                      Be the first to share your thoughts about this movie.
                    </p>
                  </div>
                ) : (
                  reviews.map((review) => {

                    const reviewUser =
                      typeof review.user === "object"
                        ? review.user
                        : null;

                    const reviewerName =
                      reviewUser?.name || "Movie Hub User";

                    const reviewerPhoto =
                      reviewUser?.profilePhoto;

                    return (
                      <article
                        className="sidebar-review"
                        key={review._id}
                      >

                        {/* USER */}
                        <div className="sidebar-review-top">

                          <div className="review-user">
                            {reviewerPhoto ? (
                              <img
                                src={reviewerPhoto}
                                alt={`${reviewerName} profile`}
                                className="review-user-avatar"
                              />
                            ) : (
                              <div className="review-user-avatar review-avatar-fallback">
                                {getInitial(reviewerName)}
                              </div>
                            )}

                            <div className="review-user-info">
                              <h3>{reviewerName}</h3>

                              <span>
                                {formatDate(review.createdAt) ||
                                  "Recently"}
                              </span>
                            </div>
                          </div>

                          {/* RATING */}
                          <div className="sidebar-review-rating">
                            {renderStars(Number(review.rating) || 0)}

                            <strong>
                              {formatRating(review.rating)}
                            </strong>
                          </div>

                        </div>

                        {/* COMMENT */}
                        <p className="sidebar-review-comment">
                          {review.comment}
                        </p>

                        {/* OWNER ACTIONS */}
                        {isReviewOwner(review) && (
                          <div className="review-owner-actions">
                            <button
                              type="button"
                              className="delete-review-button"
                              onClick={() =>
                                handleDeleteReview(review._id)
                              }
                            >
                              Delete Review
                            </button>
                          </div>
                        )}

                      </article>
                    );
                  })
                )}

              </div>

            </div>

          </aside>

        </div>

        {/* =================================================
            DELETE REVIEW CONFIRMATION MODAL
        ================================================= */}
        {deleteReviewId && (
          <div
            className="delete-review-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-review-title"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !deletingReviewId
              ) {
                closeDeleteReview();
              }
            }}
          >
            <div className="delete-review-modal">
              <div className="delete-review-modal-icon">
                !
              </div>

              <h3 id="delete-review-title">
                Delete Review
              </h3>

              <p>
                Are you sure you want to delete this review?
              </p>

              <p className="delete-review-modal-warning">
                This action cannot be undone.
              </p>

              <div className="delete-review-modal-actions">
                <button
                  type="button"
                  className="delete-review-cancel-btn"
                  onClick={closeDeleteReview}
                  disabled={Boolean(deletingReviewId)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="delete-review-confirm-btn"
                  onClick={confirmDeleteReview}
                  disabled={Boolean(deletingReviewId)}
                >
                  {deletingReviewId
                    ? "Deleting..."
                    : "Delete Review"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Moviedetails;
