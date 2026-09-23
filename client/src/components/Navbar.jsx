import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useEffect, useRef, useState } from "react";

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

function Navbar() {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [user, setUser] = useState(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const accountMenuRef = useRef(null);

  // ======================================================
  // LOAD USER
  // ======================================================

  useEffect(() => {
    const loadUser = () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      setIsAuthenticated(Boolean(token));

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error(
            "Failed to parse navbar user:",
            error
          );

          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    loadUser();

    window.addEventListener("storage", loadUser);
    window.addEventListener("auth-change", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("auth-change", loadUser);
    };
  }, []);

  // ======================================================
  // AUTOMATIC LOGOUT AFTER 15 MINUTES OF INACTIVITY
  // ======================================================

  useEffect(() => {
    if (!isAuthenticated) return;

    let inactivityTimer;

    const logoutForInactivity = () => {
      console.log(
        "User inactive for 15 minutes. Logging out."
      );

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setIsAuthenticated(false);
      setUser(null);
      setAccountMenuOpen(false);

      window.dispatchEvent(
        new Event("auth-change")
      );

      navigate("/login", {
        replace: true,
      });
    };

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);

      inactivityTimer = setTimeout(
        logoutForInactivity,
        INACTIVITY_LIMIT
      );
    };

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(
        event,
        resetInactivityTimer
      );
    });

    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);

      activityEvents.forEach((event) => {
        window.removeEventListener(
          event,
          resetInactivityTimer
        );
      });
    };
  }, [isAuthenticated, navigate]);

  // ======================================================
  // CLOSE ACCOUNT DROPDOWN WHEN CLICKING OUTSIDE
  // ======================================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // ======================================================
  // CLOSE DROPDOWN WITH ESCAPE
  // ======================================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // ======================================================
  // MANUAL LOGOUT
  // ======================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsAuthenticated(false);
    setUser(null);
    setAccountMenuOpen(false);

    window.dispatchEvent(
      new Event("auth-change")
    );

    navigate("/login", {
      replace: true,
    });
  };

  // ======================================================
  // NAVLINK CLASS
  // ======================================================

  const getNavClass = ({ isActive }) =>
    isActive ? "nav-active" : "";

  // ======================================================
  // ACCOUNT DROPDOWN TOGGLE
  // ======================================================

  const toggleAccountMenu = () => {
    setAccountMenuOpen((previous) => !previous);
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <header className="navbar">

      <div className="navbar-container">

        {/* ==================================================
            LOGO
        ================================================== */}

        <NavLink
          to="/"
          className="navbar-brand"
        >
          <span className="brand-mark">
            M
          </span>

          <span className="brand-text">
            Movie Review
          </span>
        </NavLink>

        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <nav className="nav-links">

          {/* MOVIES */}

          <NavLink
            to="/"
            className={getNavClass}
          >
            Browse
          </NavLink>


          {/* ADMIN DASHBOARD */}

          {isAuthenticated &&
            user?.role === "admin" && (
              <NavLink
                to="/admin"
                className={getNavClass}
              >
                Admin
              </NavLink>
            )}


          {/* ==================================================
              ACCOUNT DROPDOWN
          ================================================== */}

          {isAuthenticated && (
            <div
              className="account-dropdown"
              ref={accountMenuRef}
            >

              <button
                type="button"
                className={`account-dropdown-trigger ${
                  accountMenuOpen
                    ? "account-dropdown-open"
                    : ""
                }`}
                onClick={toggleAccountMenu}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
              >
                Profile

                <span
                  className={`account-dropdown-arrow ${
                    accountMenuOpen
                      ? "arrow-up"
                      : ""
                  }`}
                >
                  ▾
                </span>
              </button>


              {accountMenuOpen && (
                <div
                  className="account-dropdown-menu"
                  role="menu"
                >

                  {/* ACCOUNT */}

                  <NavLink
                    to="/account"
                    className={({ isActive }) =>
                      `account-dropdown-item ${
                        isActive
                          ? "dropdown-item-active"
                          : ""
                      }`
                    }
                    onClick={() =>
                      setAccountMenuOpen(false)
                    }
                    role="menuitem"
                  >
                    <span>
                      MyAccount
                    </span>
                  </NavLink>


                  {/* LOGOUT */}

                  <button
                    type="button"
                    className="account-dropdown-item dropdown-logout"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <span>
                      Logout
                    </span>
                  </button>

                </div>
              )}

            </div>
          )}


          {/* ==================================================
              LOGIN / REGISTER
          ================================================== */}

          {!isAuthenticated && (
            <>
              <NavLink
                to="/login"
                className={getNavClass}
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className={getNavClass}
              >
                Register
              </NavLink>
            </>
          )}

        </nav>

      </div>

    </header>
  );
}

export default Navbar;