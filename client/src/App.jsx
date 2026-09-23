import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import AdminRoute from "./components/AdminRoutes";

import Movies from "./pages/Movies";
import Moviedetails from "./pages/Moviedetails";
import Login from "./pages/Login";
import Register from "./pages/register";
import Account from "./pages/Account";
import AdminDashboard from "./pages/AdminDashboard";


function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <main>
        <Routes>

          {/* ==================================================
              PUBLIC ROUTES
          ================================================== */}

          <Route
            path="/"
            element={
              <Movies />
            }
          />

          <Route
            path="/movies"
            element={
              <Movies />
            }
          />

          <Route
            path="/movies/:id"
            element={
              <Moviedetails />
            }
          />

          <Route
            path="/login"
            element={
              <Login />
            }
          />

          <Route
            path="/register"
            element={
              <Register />
            }
          />


          {/* ==================================================
              USER ACCOUNT
          ================================================== */}

          <Route
            path="/account"
            element={
              <Account />
            }
          />


          {/* ==================================================
              ADMIN
          ================================================== */}

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* ==================================================
              FALLBACK
          ================================================== */}

          <Route
            path="*"
            element={
              <Movies />
            }
          />

        </Routes>
      </main>

    </BrowserRouter>
  );
}


export default App;