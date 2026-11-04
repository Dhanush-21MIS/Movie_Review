import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useEffect, useRef, useState } from "react";

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

function Navbar() {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [user, setUser] = useState(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // Keep the website in light mode.
  useEffect(() => {
    document.documentElement.dataset.theme = "light";

    try {
      localStorage.removeItem("movie-hub-theme");
    } catch {
      // Ignore storage restrictions; the page still uses light mode.
    }
  }, []);

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
  // AUTOMATIC SESSION TIMEOUT AFTER 15 MINUTES OF INACTIVITY
  // Shared across tabs using localStorage.
  // ======================================================

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let inactivityTimer = null;
    let lastActivityWrite = 0;
    const activityKey = "movie-hub-last-activity";

    const removeSession = (reason) => {
      if (inactivityTimer) clearTimeout(inactivityTimer);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem(activityKey);

      setIsAuthenticated(false);
      setUser(null);
      setAccountMenuOpen(false);

      window.dispatchEvent(new Event("auth-change"));

      if (reason === "timeout") {
        window.alert("You have been logged out due to session inactive.");
      }

      navigate("/login", { replace: true });
    };

    const scheduleTimeout = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);

      const lastActivity = Number(localStorage.getItem(activityKey)) || Date.now();
      const elapsed = Date.now() - lastActivity;
      const remaining = INACTIVITY_LIMIT - elapsed;

      if (remaining <= 0) {
        removeSession("timeout");
        return;
      }

      inactivityTimer = setTimeout(() => {
        // Re-check the shared timestamp in case another tab was active.
        scheduleTimeout();
      }, remaining);
    };

    const recordActivity = () => {
      if (!localStorage.getItem("token")) return;

      const now = Date.now();
      // Avoid writing to localStorage on every mouse-move event.
      if (now - lastActivityWrite >= 1000) {
        localStorage.setItem(activityKey, String(now));
        lastActivityWrite = now;
      }

      scheduleTimeout();
    };

    const handleStorage = (event) => {
      if (event.key === activityKey) {
        scheduleTimeout();
      } else if (event.key === "token" && !event.newValue) {
        // Another tab logged out or the session was removed.
        setIsAuthenticated(false);
        setUser(null);
        setAccountMenuOpen(false);
        if (inactivityTimer) clearTimeout(inactivityTimer);
        navigate("/login", { replace: true });
      }
    };

    if (!localStorage.getItem(activityKey)) {
      localStorage.setItem(activityKey, String(Date.now()));
    }

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", scheduleTimeout);

    scheduleTimeout();

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", scheduleTimeout);
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
    localStorage.removeItem("movie-hub-last-activity");

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