import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function TopNavbar({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = localStorage.getItem("userEmail");
  const [menuOpen, setMenuOpen] = useState(false);

  const isDashboard = location.pathname === "/dashboard";
  const isAnalytics = location.pathname === "/analytics";
  const isFavorites = location.pathname === "/favorites";
  const isSettings = location.pathname === "/settings";

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    setMenuOpen(false);
    navigate("/auth");
  };

  return (
    <>
      <style>{`
        .navbar-custom {
          background: white;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 1rem 1.5rem;
        }

        .navbar-brand-text {
          font-weight: bold;
          font-size: 1.25rem;
          cursor: pointer;
          color: #333;
        }

        .nav-buttons-desktop {
          display: flex;
          gap: 0.5rem;
        }

        .profile-dropdown {
          position: relative;
        }

        .profile-btn {
          background: #f0f0f0;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s;
        }

        .profile-btn:hover {
          background: #e0e0e0;
        }

        /* Mobile Menu */
        .mobile-menu-toggle {
          display: none;
          background: transparent;
          border: 1px solid #ddd;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 1.2rem;
          color: #333;
        }

        .mobile-nav-menu {
          display: none;
          position: fixed;
          top: 70px;
          left: 0;
          right: 0;
          background: white;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          padding: 1rem;
          max-height: calc(100vh - 70px);
          overflow-y: auto;
        }

        .mobile-nav-menu.open {
          display: block;
        }

        .mobile-nav-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .mobile-nav-buttons button {
          width: 100%;
          padding: 0.75rem;
          border-radius: 8px;
          font-weight: 500;
        }

        .mobile-user-info {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .mobile-user-email {
          color: #667eea;
          font-weight: 500;
          word-break: break-all;
          font-size: 0.9rem;
        }

        .mobile-logout-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 8px;
          width: 100%;
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-buttons-desktop,
          .profile-dropdown {
            display: none !important;
          }

          .mobile-menu-toggle {
            display: block;
          }

          .navbar-brand-text {
            font-size: 1rem;
          }

          .navbar-custom {
            padding: 0.75rem 1rem;
          }
        }

        @media (max-width: 480px) {
          .navbar-brand-text {
            font-size: 0.9rem;
          }
        }
      `}</style>

      <nav className="navbar-custom">
        <div className="d-flex justify-content-between align-items-center w-100">
          {/* LEFT: WEBSITE NAME */}
          <span
            className="navbar-brand-text"
            onClick={() => navigate("/dashboard")}
          >
            🤖 AI Notes
          </span>

          {/* CENTER: PAGE NAV (Desktop Only) */}
          <div className="nav-buttons-desktop">
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
                isFavorites ? "btn-danger" : "btn-outline-danger"
              }`}
              onClick={() => navigate("/favorites")}
            >
              ❤️ Favorites
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

          {/* RIGHT: PROFILE (Desktop Only) */}
          <div className="profile-dropdown dropdown">
            <button
              className="profile-btn"
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
                  className="dropdown-item"
                  onClick={() => navigate("/settings")}
                >
                  <i className="fas fa-cog me-2"></i>
                  Settings
                </button>
              </li>

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

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`mobile-nav-menu ${menuOpen ? 'open' : ''}`}>
          {/* Navigation Buttons */}
          <div className="mobile-nav-buttons">
            <button
              className={`btn ${
                isDashboard ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => {
                navigate("/dashboard");
                setMenuOpen(false);
              }}
            >
              <i className="fas fa-home me-2"></i>
              Dashboard
            </button>

            <button
              className={`btn ${
                isFavorites ? "btn-danger" : "btn-outline-danger"
              }`}
              onClick={() => {
                navigate("/favorites");
                setMenuOpen(false);
              }}
            >
              <i className="fas fa-heart me-2"></i>
              Favorites
            </button>

            <button
              className={`btn ${
                isAnalytics ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => {
                navigate("/analytics");
                setMenuOpen(false);
              }}
            >
              <i className="fas fa-chart-bar me-2"></i>
              Analytics
            </button>

            <button
              className={`btn btn-outline-secondary`}
              onClick={() => {
                navigate("/settings");
                setMenuOpen(false);
              }}
            >
              <i className="fas fa-cog me-2"></i>
              Settings
            </button>
          </div>

          {/* User Info */}
          <div className="mobile-user-info">
            <div className="small text-muted mb-1">Signed in as</div>
            <div className="mobile-user-email">
              <i className="fas fa-user-circle me-2"></i>
              {userEmail}
            </div>
          </div>

          {/* Logout Button */}
          <button onClick={handleLogout} className="mobile-logout-btn">
            <i className="fas fa-sign-out-alt me-2"></i>
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}