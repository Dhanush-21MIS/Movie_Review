import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Movies() {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("recommended");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/movies");

        if (!mounted) return;

        /*
         * Backend currently returns:
         *
         * [
         *   { _id, title, description, ... },
         *   ...
         * ]
         *
         * So response.data itself is the movies array.
         */
        const movieData = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.movies)
          ? response.data.movies
          : null;

        if (!movieData) {
          throw new Error("Invalid movies response from server.");
        }

        setMovies(movieData);
      } catch (err) {
        if (!mounted) return;

        console.error("Failed to fetch movies:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load movies. Please try again."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchMovies();

    return () => {
      mounted = false;
    };
  }, []);

  // Get movie rating
  const getRating = (movie) => {
    const rating = Number(
      movie.averageRating ?? movie.initialRating ?? 0
    );

    return Number.isFinite(rating) ? rating : 0;
  };

  // Get release date for sorting
  const getReleaseDate = (movie) => {
    if (movie.releaseDate) {
      const timestamp = new Date(movie.releaseDate).getTime();

      if (!Number.isNaN(timestamp)) {
        return timestamp;
      }
    }

    if (movie.releaseYear) {
      const timestamp = new Date(
        `${movie.releaseYear}-01-01`
      ).getTime();

      if (!Number.isNaN(timestamp)) {
        return timestamp;
      }
    }

    if (movie.createdAt) {
      const timestamp = new Date(movie.createdAt).getTime();

      if (!Number.isNaN(timestamp)) {
        return timestamp;
      }
    }

    return 0;
  };

  // Search + sorting
  const filteredAndSortedMovies = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    let result = movies.filter((movie) => {
      if (!search) return true;

      const title = movie.title?.toLowerCase() || "";
      const director = movie.director?.toLowerCase() || "";
      const description = movie.description?.toLowerCase() || "";

      const genres = Array.isArray(movie.genre)
        ? movie.genre.join(" ").toLowerCase()
        : "";

      return (
        title.includes(search) ||
        director.includes(search) ||
        description.includes(search) ||
        genres.includes(search)
      );
    });

    result = [...result];

    switch (sortOption) {
      case "highest":
        result.sort((a, b) => getRating(b) - getRating(a));
        break;

      case "lowest":
        result.sort((a, b) => getRating(a) - getRating(b));
        break;

      case "newest":
        result.sort(
          (a, b) => getReleaseDate(b) - getReleaseDate(a)
        );
        break;

      case "oldest":
        result.sort(
          (a, b) => getReleaseDate(a) - getReleaseDate(b)
        );
        break;

      case "az":
        result.sort((a, b) =>
          (a.title || "").localeCompare(
            b.title || "",
            undefined,
            {
              sensitivity: "base",
            }
          )
        );
        break;

      case "recommended":
      default:
        /*
         * Recommended:
         * 1. Higher rating first
         * 2. Newer movies first when ratings are equal
         */
        result.sort((a, b) => {
          const ratingDifference =
            getRating(b) - getRating(a);

          if (ratingDifference !== 0) {
            return ratingDifference;
          }

          return getReleaseDate(b) - getReleaseDate(a);
        });

        break;
    }

    return result;
  }, [movies, searchTerm, sortOption]);

  // Format rating
  const formatRating = (rating) => {
    if (!rating) {
      return "No rating";
    }

    return Number(rating).toFixed(1);
  };

  // Format release year
  const formatYear = (movie) => {
    if (movie.releaseYear) {
      return movie.releaseYear;
    }

    if (movie.releaseDate) {
      const date = new Date(movie.releaseDate);

      if (!Number.isNaN(date.getTime())) {
        return date.getFullYear();
      }
    }

    return "N/A";
  };

  // Get up to 3 genres
  const getGenres = (movie) => {
    if (!Array.isArray(movie.genre)) {
      return [];
    }

    return movie.genre
      .filter(Boolean)
      .slice(0, 3);
  };

  // Retry
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <section className="movies-page">
      <div className="movies-container">

        {/* HERO */}
        <div className="movies-hero">
          <div className="movies-hero-content">
            <span className="section-eyebrow">
              DISCOVER • REVIEW • ENJOY
            </span>

            <h1>Explore Movies</h1>

            <p>
              Discover movies, explore their details, and share
              your thoughts with the Movie Hub community.
            </p>
          </div>
        </div>

        {/* SEARCH + SORT */}
        <div className="movies-toolbar">

          <div className="movie-search-wrapper">
            <span
              className="search-icon"
              aria-hidden="true"
            >
              ⌕
            </span>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search movies..."
              aria-label="Search movies"
            />

            {searchTerm && (
              <button
                type="button"
                className="search-clear-button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="movie-sort-wrapper">
            <label htmlFor="movie-sort">
              Sort by
            </label>

            <select
              id="movie-sort"
              value={sortOption}
              onChange={(event) =>
                setSortOption(event.target.value)
              }
            >
              <option value="recommended">
                Recommended
              </option>

              <option value="highest">
                Highest Rated
              </option>

              <option value="lowest">
                Lowest Rated
              </option>

              <option value="newest">
                Newest First
              </option>

              <option value="oldest">
                Oldest First
              </option>

              <option value="az">
                A → Z
              </option>
            </select>
          </div>
        </div>

        {/* RESULTS INFO */}
        {!loading && !error && (
          <div className="movies-results-info">
            <span>
              {filteredAndSortedMovies.length}{" "}
              {filteredAndSortedMovies.length === 1
                ? "movie"
                : "movies"}
            </span>

            {searchTerm && (
              <span>
                Results for{" "}
                <strong>
                  "{searchTerm}"
                </strong>
              </span>
            )}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="movies-loading">
            <div className="loading-spinner"></div>

            <p>Loading movies...</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="movies-error">
            <div className="error-icon">
              !
            </div>

            <h2>
              Unable to load movies
            </h2>

            <p>{error}</p>

            <button
              type="button"
              className="primary-button"
              onClick={handleRetry}
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          filteredAndSortedMovies.length === 0 && (
            <div className="movies-empty">
              <div className="empty-icon">
                ⌕
              </div>

              <h2>
                {searchTerm
                  ? "No movies found"
                  : "No movies available"}
              </h2>

              <p>
                {searchTerm
                  ? "Try searching with a different movie title, director, genre, or keyword."
                  : "There are currently no movies available."}
              </p>

              {searchTerm && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

        {/* MOVIE GRID */}
        {!loading &&
          !error &&
          filteredAndSortedMovies.length > 0 && (
            <div className="movies-grid">
              {filteredAndSortedMovies.map((movie) => {
                const rating = getRating(movie);
                const genres = getGenres(movie);

                const movieId =
                  movie._id || movie.id;

                return (
                  <article
                    className="movie-card"
                    key={movieId}
                  >

                    {/* POSTER */}
                    <Link
                      to={`/movies/${movieId}`}
                      className="movie-poster-link"
                      aria-label={`View ${movie.title}`}
                    >
                      <div className="movie-poster-wrapper">

                        {movie.poster ? (
                          <>
                            <img
                            src={movie.poster}
                            alt={`${movie.title} poster`}
                            className="movie-poster"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                              event.currentTarget.nextElementSibling?.removeAttribute("hidden");
                            }}
                          />
                            <div
                              className="movie-poster-fallback"
                              hidden
                              aria-hidden="true"
                            >
                              Movie Hub
                            </div>
                          </>
                        ) : (
                          <div className="movie-poster-placeholder">
                            <span>
                              Movie Hub
                            </span>
                          </div>
                        )}

                        <div className="movie-poster-overlay">
                          <span>
                            View Details
                          </span>
                        </div>

                      </div>
                    </Link>

                    {/* CARD CONTENT */}
                    <div className="movie-card-content">

                      <div className="movie-card-top">

                        <h2 className="movie-title">
                          <Link
                            to={`/movies/${movieId}`}
                          >
                            {movie.title}
                          </Link>
                        </h2>

                        <span className="movie-rating">
                          <span aria-hidden="true">
                            ★
                          </span>{" "}
                          {formatRating(rating)}
                        </span>

                      </div>

                      {/* META */}
                      <div className="movie-meta">

                        <span>
                          {formatYear(movie)}
                        </span>

                        {movie.director && (
                          <>
                            <span className="meta-divider">
                              •
                            </span>

                            <span>
                              {movie.director}
                            </span>
                          </>
                        )}

                      </div>

                      {/* GENRES */}
                      {genres.length > 0 && (
                        <div className="movie-genres">
                          {genres.map((genre) => (
                            <span
                              className="movie-genre"
                              key={`${movieId}-${genre}`}
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}

                    </div>
                  </article>
                );
              })}
            </div>
          )}

      </div>
    </section>
  );
}

export default Movies;