import { Navigate } from "react-router-dom";


function AdminRoute({ children }) {
  const token =
    localStorage.getItem("token");

  const storedUser =
    localStorage.getItem("user");


  // ======================================================
  // NOT LOGGED IN
  // ======================================================

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  // ======================================================
  // READ USER
  // ======================================================

  let user = null;

  try {
    user = storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch (error) {
    console.error(
      "Failed to parse stored user:",
      error
    );

    localStorage.removeItem(
      "user"
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  // ======================================================
  // ADMIN CHECK
  // ======================================================

  if (
    !user ||
    user.role !== "admin"
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  // ======================================================
  // AUTHORIZED
  // ======================================================

  return children;
}


export default AdminRoute;