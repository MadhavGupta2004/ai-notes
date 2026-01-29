import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function TopNavbar({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = localStorage.getItem("userEmail");

  const isDashboard = location.pathname === "/dashboard";
  const isAnalytics = location.pathname === "/analytics";

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    navigate("/auth");
  };

  return (
    <nav className="navbar navbar-light bg-white shadow-sm px-4 d-flex align-items-center justify-content-between">
      
      {/* LEFT: WEBSITE NAME */}
      <span
        className="navbar-brand fw-bold"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/dashboard")}
      >
        🤖 AI Notes
      </span>

      {/* CENTER: PAGE NAV */}
      <div className="d-flex gap-2">
        <button
          className={`btn btn-sm ${
            isDashboard ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </button>

        <button
          className={`btn btn-sm ${
            isAnalytics ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => navigate("/analytics")}
        >
          Analytics
        </button>
      </div>

      {/* RIGHT: PROFILE */}
      <div className="dropdown">
        <button
          className="btn btn-light rounded-circle"
          data-bs-toggle="dropdown"
        >
          <i className="fas fa-user"></i>
        </button>

        <ul className="dropdown-menu dropdown-menu-end">
          <li className="dropdown-item-text small text-muted">
            Signed in as
          </li>

          <li className="dropdown-item-text fw-semibold">
            {userEmail}
          </li>

          <li><hr className="dropdown-divider" /></li>

          <li>
            <button
              className="dropdown-item text-danger"
              onClick={handleLogout}
            >
              <i className="fas fa-sign-out-alt me-2"></i>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
