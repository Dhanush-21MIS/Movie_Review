import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../api";


// ======================================================
// PROFILE IMAGES
// ======================================================

const stockImages = [
  "https://img.freepik.com/free-photo/3d-illustration-cute-cartoon-girl-blue-jacket-glasses_1142-41044.jpg?t=st=1720699838~exp=1720703438~hmac=db8f82804eba9cd2e70793f2cb96d4c0dc6daa0e87198450b1c49411b7f35b99&w=740",

  "https://img.freepik.com/free-photo/portrait-young-woman-wearing-glasses-3d-rendering_1142-43632.jpg?t=st=1720699860~exp=1720703460~hmac=e1a09ca9759d473b88b2e486ad2b655514075747f4405db7dbd06c0de21c02e&w=740",

  "https://img.freepik.com/free-photo/3d-illustration-cute-cartoon-boy-with-backpack-his-back_1142-40542.jpg?t=st=1720699910~exp=1720699910~hmac=deb0af99e9193691eb9919ddd891df805bea831cf55f0f750fbeb6891a6a8085&w=740",

  "https://img.freepik.com/free-photo/portrait-handsome-hipster-man-glasses-3d-rendering_1142-51612.jpg?t=st=1720699952~exp=1720703552~hmac=ecf87a4b8f7cb2d35e83507538595e5e5fd4b445913accb45c1a305ff3178b34&w=740",
];


// ======================================================
// ACCOUNT
// ======================================================

function Account() {

  const navigate =
    useNavigate();


  const [user, setUser] =
    useState(null);

  const [reviews, setReviews] =
    useState([]);


  const [profileOptions] =
    useState(stockImages);


  const [
    showPhotoPicker,
    setShowPhotoPicker,
  ] = useState(false);


  const [
    selectedPhoto,
    setSelectedPhoto,
  ] = useState("");


  const [
    savingPhoto,
    setSavingPhoto,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    photoError,
    setPhotoError,
  ] = useState("");


  const [
    photoSuccess,
    setPhotoSuccess,
  ] = useState("");


  const [
    deletingReviewId,
    setDeletingReviewId,
  ] = useState(null);


  // ======================================================
  // LOAD ACCOUNT
  // ======================================================

  useEffect(() => {

    let mounted = true;


    const loadAccount =
      async () => {

        if (!mounted) {
          return;
        }


        setLoading(true);
        setError("");


        console.log(
          "================================="
        );

        console.log(
          "MOVIE HUB ACCOUNT"
        );

        console.log(
          "================================="
        );


        const token =
          localStorage.getItem(
            "token"
          );


        console.log(
          "TOKEN EXISTS:",
          Boolean(token)
        );

        console.log(
          "TOKEN LENGTH:",
          token?.length || 0
        );


        // ==================================================
        // TOKEN CHECK
        // ==================================================

        if (!token) {

          console.error(
            "No authentication token found."
          );


          if (mounted) {

            setLoading(false);

            navigate(
              "/login",
              {
                replace: true,
              }
            );
          }

          return;
        }


        // ==================================================
        // GET USER
        // ==================================================

        let userResponse;


        try {

          console.log(
            "Calling GET /auth/me"
          );


          userResponse =
            await api.get(
              "/auth/me"
            );


          console.log(
            "================================="
          );

          console.log(
            "AUTH /ME SUCCESS"
          );

          console.log(
            "STATUS:",
            userResponse.status
          );

          console.log(
            "DATA:",
            userResponse.data
          );

          console.log(
            "================================="
          );


        } catch (err) {

          console.error(
            "================================="
          );

          console.error(
            "AUTH /ME FAILED"
          );

          console.error(
            "ERROR:",
            err
          );

          console.error(
            "MESSAGE:",
            err?.message
          );

          console.error(
            "CODE:",
            err?.code
          );

          console.error(
            "STATUS:",
            err?.response?.status
          );

          console.error(
            "RESPONSE:",
            err?.response?.data
          );

          console.error(
            "URL:",
            err?.config?.url
          );

          console.error(
            "BASE URL:",
            err?.config?.baseURL
          );

          console.error(
            "METHOD:",
            err?.config?.method
          );

          console.error(
            "================================="
          );


          if (!mounted) {
            return;
          }


          // ------------------------------------------------
          // 401
          // ------------------------------------------------

          if (
            err?.response?.status ===
            401
          ) {

            localStorage.removeItem(
              "token"
            );

            localStorage.removeItem(
              "user"
            );


            window.dispatchEvent(
              new Event(
                "auth-change"
              )
            );


            setLoading(false);


            navigate(
              "/login",
              {
                replace: true,
              }
            );


            return;
          }


          // ------------------------------------------------
          // Backend unreachable
          // ------------------------------------------------

          if (
            !err?.response
          ) {

            setError(
              `Cannot connect to the Movie Hub server. ${err?.message || "Network error"}`
            );

            setLoading(false);

            return;
          }


          // ------------------------------------------------
          // Server error
          // ------------------------------------------------

          if (
            err.response.status >=
            500
          ) {

            setError(
              `Server error (${err.response.status}). Please check the backend terminal.`
            );

            setLoading(false);

            return;
          }


          // ------------------------------------------------
          // Other error
          // ------------------------------------------------

          setError(
            err.response?.data
              ?.message ||
              `Request failed with status ${err.response.status}`
          );


          setLoading(false);

          return;
        }


        // ==================================================
        // VALIDATE RESPONSE
        // ==================================================

        if (
          !userResponse ||
          !userResponse.data
        ) {

          setError(
            "The server returned an empty response."
          );

          setLoading(false);

          return;
        }


        if (
          userResponse.data.success !==
          true
        ) {

          console.error(
            "Invalid /auth/me response:",
            userResponse.data
          );


          setError(
            userResponse.data.message ||
              "Unable to load account."
          );


          setLoading(false);

          return;
        }


        // ==================================================
        // CREATE USER
        // ==================================================

        const currentUser = {

          id:
            userResponse.data.id,

          _id:
            userResponse.data.id,

          name:
            userResponse.data.name ||
            "",

          email:
            userResponse.data.email ||
            "",

          profilePhoto:
            userResponse.data.profilePhoto ||
            "",

          role:
            userResponse.data.role ||
            "user",

          createdAt:
            userResponse.data.createdAt ||
            null,
        };


        console.log(
          "CURRENT USER:",
          currentUser
        );


        if (!mounted) {
          return;
        }


        setUser(
          currentUser
        );


        setSelectedPhoto(
          currentUser.profilePhoto
        );


        localStorage.setItem(
          "user",
          JSON.stringify(
            currentUser
          )
        );


        window.dispatchEvent(
          new Event(
            "auth-change"
          )
        );


        // ==================================================
        // GET REVIEWS
        // ==================================================

        try {

          console.log(
            "Calling GET /reviews/my"
          );


          const reviewsResponse =
            await api.get(
              "/reviews/my"
            );


          console.log(
            "REVIEWS STATUS:",
            reviewsResponse.status
          );


          console.log(
            "REVIEWS DATA:",
            reviewsResponse.data
          );


          if (
            reviewsResponse.data
              ?.success === true
          ) {

            const accountReviews =
              Array.isArray(
                reviewsResponse
                  .data
                  .reviews
              )
                ? reviewsResponse
                    .data
                    .reviews
                : [];


            if (mounted) {

              setReviews(
                accountReviews
              );
            }

          } else {

            setReviews([]);
          }


        } catch (err) {

          console.error(
            "REVIEWS API FAILED:",
            err
          );

          console.error(
            "REVIEWS STATUS:",
            err?.response?.status
          );

          console.error(
            "REVIEWS RESPONSE:",
            err?.response?.data
          );


          // Reviews failure must NOT
          // break the account page.

          if (mounted) {
            setReviews([]);
          }
        }


        // ==================================================
        // COMPLETE
        // ==================================================

        if (mounted) {

          setLoading(false);

          console.log(
            "ACCOUNT LOADED SUCCESSFULLY"
          );
        }
      };


    loadAccount();


    return () => {
      mounted = false;
    };

  }, [navigate]);


  // ======================================================
  // INITIAL
  // ======================================================

  const getInitial =
    (name) => {

      if (!name) {
        return "U";
      }

      return name
        .trim()
        .charAt(0)
        .toUpperCase();
    };


  // ======================================================
  // DATE
  // ======================================================

  const formatDate =
    (value) => {

      if (!value) {
        return "N/A";
      }


      const date =
        new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "N/A";
      }


      return date.toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );
    };


  // ======================================================
  // RATING
  // ======================================================

  const formatRating =
    (value) => {

      const rating =
        Number(value);


      if (
        !Number.isFinite(
          rating
        )
      ) {
        return "0.0";
      }


      return rating.toFixed(1);
    };


  // ======================================================
  // MOVIE ID
  // ======================================================

  const getMovieId =
    (movie) => {

      if (!movie) {
        return null;
      }


      if (
        typeof movie ===
        "string"
      ) {
        return movie;
      }


      return (
        movie._id ||
        movie.id ||
        null
      );
    };


  // ======================================================
  // OPEN PHOTO PICKER
  // ======================================================

  const handleOpenPhotoPicker =
    () => {

      setPhotoError("");
      setPhotoSuccess("");


      setSelectedPhoto(
        user?.profilePhoto ||
          stockImages[0]
      );


      setShowPhotoPicker(
        true
      );
    };


  // ======================================================
  // CLOSE PHOTO PICKER
  // ======================================================

  const handleClosePhotoPicker =
    () => {

      if (savingPhoto) {
        return;
      }


      setShowPhotoPicker(
        false
      );

      setPhotoError("");

      setPhotoSuccess("");


      setSelectedPhoto(
        user?.profilePhoto ||
          ""
      );
    };


  // ======================================================
  // SELECT PHOTO
  // ======================================================

  const handleSelectPhoto =
    (photo) => {

      setSelectedPhoto(
        photo
      );

      setPhotoError("");
      setPhotoSuccess("");
    };


  // ======================================================
  // SAVE PHOTO
  // ======================================================

  const handleSavePhoto =
    async () => {

      if (!selectedPhoto) {

        setPhotoError(
          "Please select a profile picture."
        );

        return;
      }


      try {

        setSavingPhoto(true);

        setPhotoError("");
        setPhotoSuccess("");


        const response =
          await api.put(
            "/auth/profile-picture",
            {
              profilePhoto:
                selectedPhoto,
            }
          );


        console.log(
          "PROFILE PHOTO RESPONSE:",
          response.data
        );


        if (
          response.data?.success !==
          true
        ) {

          throw new Error(
            response.data
              ?.message ||
              "Unable to update profile picture."
          );
        }


        const updatedPhoto =
          response.data
            ?.user
            ?.profilePhoto ||
          response.data
            ?.profilePhoto ||
          selectedPhoto;


        const updatedUser = {
          ...user,

          profilePhoto:
            updatedPhoto,
        };


        setUser(
          updatedUser
        );


        setSelectedPhoto(
          updatedPhoto
        );


        localStorage.setItem(
          "user",
          JSON.stringify(
            updatedUser
          )
        );


        window.dispatchEvent(
          new Event(
            "auth-change"
          )
        );


        setPhotoSuccess(
          response.data.message ||
            "Profile picture updated successfully."
        );


        setTimeout(
          () => {

            setShowPhotoPicker(
              false
            );

            setPhotoSuccess(
              ""
            );

          },
          900
        );


      } catch (err) {

        console.error(
          "Profile photo update failed:",
          err
        );


        if (
          err?.response?.status ===
          401
        ) {

          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "user"
          );


          window.dispatchEvent(
            new Event(
              "auth-change"
            )
          );


          navigate(
            "/login",
            {
              replace: true,
            }
          );

          return;
        }


        setPhotoError(
          err.response?.data
            ?.message ||
            err.message ||
            "Unable to update profile picture."
        );

      } finally {

        setSavingPhoto(
          false
        );
      }
    };


  // ======================================================
  // DELETE REVIEW
  // ======================================================

  const handleDeleteReview =
    async (
      reviewId
    ) => {

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this review?"
        );


      if (!confirmed) {
        return;
      }


      try {

        setDeletingReviewId(
          reviewId
        );


        const response =
          await api.delete(
            `/reviews/${reviewId}`
          );


        if (
          response.data
            ?.success !== true
        ) {

          throw new Error(
            response.data
              ?.message ||
              "Unable to delete the review."
          );
        }


        setReviews(
          (
            previousReviews
          ) =>
            previousReviews.filter(
              (review) =>
                String(
                  review._id
                ) !==
                String(
                  reviewId
                )
            )
        );


      } catch (err) {

        console.error(
          "Failed to delete review:",
          err
        );


        alert(
          err.response?.data
            ?.message ||
            err.message ||
            "Unable to delete the review."
        );

      } finally {

        setDeletingReviewId(
          null
        );
      }
    };


  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {

    return (
      <section className="account-page">

        <div className="account-container">

          <div className="account-loading">

            <div className="loading-spinner"></div>

            <p>
              Loading your account...
            </p>

          </div>

        </div>

      </section>
    );
  }


  // ======================================================
  // ERROR
  // ======================================================

  if (
    error ||
    !user
  ) {

    return (
      <section className="account-page">

        <div className="account-container">

          <div className="account-error">

            <div className="error-icon">
              !
            </div>


            <h1>
              Unable to Load Account
            </h1>


            <p>
              {error ||
                "User information could not be loaded."}
            </p>


            <button
              type="button"
              className="primary-button"
              onClick={() =>
                window.location.reload()
              }
            >
              Try Again
            </button>

          </div>

        </div>

      </section>
    );
  }


  // ======================================================
  // ACCOUNT PAGE
  // ======================================================

  return (
    <section className="account-page">

      <div className="account-container">

        <div className="account-header">

          <div>

            <span className="section-eyebrow">
              MY ACCOUNT
            </span>

            <h1>
              Account
            </h1>

            <p>
              Manage your profile and
              view your movie reviews.
            </p>

          </div>

        </div>


        <div className="account-layout">

          {/* ==================================================
              PROFILE
          ================================================== */}

          <aside className="profile-card">

            <div className="profile-photo-section">

              {user.profilePhoto ? (

                <img
                  src={
                    user.profilePhoto
                  }
                  alt={`${user.name}'s profile`}
                  className="account-profile-photo"
                />

              ) : (

                <div className="account-profile-fallback">

                  {getInitial(
                    user.name
                  )}

                </div>
              )}


              <button
                type="button"
                className="change-photo-button"
                onClick={
                  handleOpenPhotoPicker
                }
              >
                Change Photo
              </button>

            </div>


            <div className="profile-info">

              <h2>
                {user.name}
              </h2>


              <p className="profile-email">
                {user.email}
              </p>


              <span className="profile-role">

                {user.role ===
                "admin"
                  ? "Administrator"
                  : "Movie Member"}

              </span>

            </div>


            <div className="profile-divider"></div>


            <div className="profile-stat">

              <span>
                Reviews Written
              </span>

              <strong>
                {reviews.length}
              </strong>

            </div>


            {user.createdAt && (

              <div className="profile-stat">

                <span>
                  Member Since
                </span>

                <strong>
                  {formatDate(
                    user.createdAt
                  )}
                </strong>

              </div>
            )}

          </aside>


          {/* ==================================================
              REVIEWS
          ================================================== */}

          <main className="account-content">

            <div className="account-section-header">

              <div>

                <span className="section-eyebrow">
                  YOUR ACTIVITY
                </span>

                <h2>
                  My Reviews
                </h2>

              </div>


              <span className="review-count">

                {reviews.length}{" "}

                {reviews.length === 1
                  ? "Review"
                  : "Reviews"}

              </span>

            </div>


            {reviews.length === 0 ? (

              <div className="account-empty">

                <div className="empty-icon">
                  ★
                </div>


                <h3>
                  No reviews yet
                </h3>


                <p>
                  You haven't reviewed
                  any movies yet. Explore
                  Movie Hub and share
                  your thoughts.
                </p>


                <Link
                  to="/"
                  className="primary-button"
                >
                  Explore Movies
                </Link>

              </div>

            ) : (

              <div className="account-reviews">

                {reviews.map(
                  (review) => {

                    const movie =
                      review.movie;


                    const movieId =
                      getMovieId(
                        movie
                      );


                    const movieTitle =
                      typeof movie ===
                      "object"
                        ? movie?.title ||
                          "Movie"
                        : "Movie";


                    const moviePoster =
                      typeof movie ===
                      "object"
                        ? movie?.poster ||
                          null
                        : null;


                    const movieYear =
                      typeof movie ===
                      "object"
                        ? movie?.releaseYear ||
                          null
                        : null;


                    return (
                      <article
                        className="account-review-card"
                        key={
                          review._id
                        }
                      >

                        <div className="account-review-movie">

                          {moviePoster ? (

                            <img
                              src={moviePoster}
                              alt={`${movieTitle} poster`}
                              className="account-review-poster"
                            />

                          ) : (

                            <div className="account-review-poster-placeholder">
                              Movie Hub
                            </div>

                          )}

                          <div className="account-review-movie-info">

                            {movieId ? (

                              <Link
                                to={`/movies/${movieId}`}
                                className="account-review-movie-title"
                              >
                                {movieTitle}
                              </Link>

                            ) : (

                              <h3 className="account-review-movie-title">
                                {movieTitle}
                              </h3>

                            )}

                            {movieYear && (
                              <span className="account-review-year">
                                {movieYear}
                              </span>
                            )}

                          </div>

                        </div>


                        <div className="account-review-content">

                          <div className="account-review-rating-row">

                            <div
                              className="account-review-rating"
                              aria-label={`Rating ${formatRating(review.rating)} out of 5`}
                            >

                              <div className="review-stars">

                                {Array.from(
                                  { length: 5 },
                                  (_, index) => (
                                    <span
                                      key={index}
                                      className={
                                        index <
                                        Number(review.rating)
                                          ? "star-filled"
                                          : "star-empty"
                                      }
                                      aria-hidden="true"
                                    >
                                      ★
                                    </span>
                                  )
                                )}

                              </div>

                              <strong className="account-review-rating-value">
                                {formatRating(review.rating)}
                              </strong>

                              <span className="account-review-rating-total">
                                / 5
                              </span>

                            </div>

                            {review.createdAt && (
                              <span className="account-review-date">
                                Reviewed on{" "}
                                {formatDate(review.createdAt)}
                              </span>
                            )}

                          </div>


                          <p className="account-review-comment">
                            {review.comment}
                          </p>


                          <button
                            type="button"
                            className="delete-review-button"
                            onClick={() =>
                              handleDeleteReview(review._id)
                            }
                            disabled={
                              deletingReviewId === review._id
                            }
                          >
                            {deletingReviewId === review._id
                              ? "Deleting..."
                              : "Delete Review"}
                          </button>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>

            )}

          </main>

        </div>

      </div>


      {/* ==================================================
          PROFILE PHOTO MODAL
      ================================================== */}

      {showPhotoPicker && (

        <div
          className="photo-modal-overlay"
          onMouseDown={
            handleClosePhotoPicker
          }
        >

          <div
            className="photo-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="photo-modal-header">

              <div>

                <span className="section-eyebrow">
                  PROFILE
                </span>

                <h2>
                  Choose Profile Picture
                </h2>

                <p>
                  Select one of the available
                  profile pictures.
                </p>

              </div>


              <button
                type="button"
                className="photo-modal-close"
                onClick={
                  handleClosePhotoPicker
                }
                disabled={
                  savingPhoto
                }
                aria-label="Close profile picture selector"
              >
                ×
              </button>

            </div>


            {photoError && (

              <div className="review-message review-message-error">
                {
                  photoError
                }
              </div>

            )}


            {photoSuccess && (

              <div className="review-message review-message-success">
                {
                  photoSuccess
                }
              </div>

            )}


            <div className="profile-photo-options">

              {profileOptions.map(
                (
                  photo,
                  index
                ) => {

                  const isSelected =
                    selectedPhoto ===
                    photo;


                  return (
                    <button
                      type="button"
                      key={photo}
                      className={`profile-photo-option ${
                        isSelected
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleSelectPhoto(
                          photo
                        )
                      }
                      disabled={
                        savingPhoto
                      }
                      aria-label={`Select profile picture ${
                        index + 1
                      }`}
                    >

                      <img
                        src={photo}
                        alt={`Profile option ${
                          index + 1
                        }`}
                      />


                      {isSelected && (

                        <span className="profile-photo-check">
                          ✓
                        </span>

                      )}

                    </button>
                  );
                }
              )}

            </div>


            <div className="photo-modal-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleClosePhotoPicker
                }
                disabled={
                  savingPhoto
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="primary-button"
                onClick={
                  handleSavePhoto
                }
                disabled={
                  savingPhoto ||
                  !selectedPhoto
                }
              >
                {savingPhoto
                  ? "Saving..."
                  : "Save Photo"}
              </button>

            </div>

          </div>

        </div>

      )}

    </section>
  );
}


export default Account;