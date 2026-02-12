import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import TopNavbar from "../components/TopNavbar";

export default function Settings() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (!isLoggedIn) {
    return null;
  }

  useEffect(() => {
    if (!localStorage.getItem("isLoggedIn")) {
      navigate("/auth");
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.log("Firebase signout failed (safe to ignore)");
    }

    localStorage.clear();
    // Dispatch custom event to trigger re-renders in same tab
    window.dispatchEvent(new Event("authStateChanged"));
    navigate("/auth", { replace: true });
  };

  const handleChangePassword = async () => {
    setMessage("");
    setLoading(true);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("Please fill in all fields");
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New passwords don't match");
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage("New password must be at least 6 characters");
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (currentPassword === newPassword) {
      setMessage("New password must be different from current password");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;

      if (!user) {
        setMessage("Session expired. Please log in again.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      // Reauthenticate user with current password
      const credential = EmailAuthProvider.credential(userEmail, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setMessage("✓ Password changed successfully!");
      setMessageType("success");
      
      // Reset form
      setTimeout(() => {
        setIsChangingPassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setMessage("");
        setLoading(false);
      }, 2000);
    } catch (err) {
      setLoading(false);
      if (err.code === "auth/wrong-password") {
        setMessage("Current password is incorrect");
      } else if (err.code === "auth/requires-recent-login") {
        setMessage("Please log out and log in again to change your password");
      } else if (err.code === "auth/weak-password") {
        setMessage("New password is too weak. Please use a stronger password");
      } else {
        setMessage(err.message || "Failed to change password. Please try again.");
      }
      setMessageType("error");
      console.error("Password change error:", err);
    }
  };
  };

  return (
    <>
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
        rel="stylesheet"
      />
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        rel="stylesheet"
      />

      <style>{`
        body {
          background: #f5f7fa;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .settings-container {
          min-height: 100vh;
          padding: 20px;
        }

        .settings-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          max-width: 600px;
          margin: 20px auto;
          padding: 30px;
        }

        .settings-section {
          margin-bottom: 30px;
        }

        .settings-section h4 {
          color: #333;
          font-weight: 600;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .settings-section h4 i {
          color: #667eea;
          font-size: 1.3rem;
        }

        .settings-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 10px;
          margin-bottom: 10px;
        }

        .settings-label {
          color: #666;
          font-weight: 500;
        }

        .form-control, .form-label {
          border-radius: 8px;
        }

        .form-control:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }

        .btn-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          border-radius: 8px;
          padding: 10px 20px;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
          color: white;
        }

        .alert-custom {
          border-radius: 10px;
          border: none;
        }

        .divider {
          border-top: 2px solid #e0e0e0;
          margin: 30px 0;
        }
      `}</style>

      <div className="settings-container">
        <TopNavbar title="⚙️ Settings" />

        <div className="settings-card">
          {/* Account Info Section */}
          <div className="settings-section">
            <h4>
              <i className="fas fa-user-circle"></i>
              Account Information
            </h4>
            <div className="settings-item">
              <div>
                <div className="settings-label">Email</div>
                <small className="text-muted">{userEmail}</small>
              </div>
              <i className="fas fa-shield-alt text-success"></i>
            </div>
          </div>

          <div className="divider"></div>

          {/* Change Password Section */}
          <div className="settings-section">
            <h4>
              <i className="fas fa-lock"></i>
              Security
            </h4>

            {!isChangingPassword ? (
              <button
                className="btn btn-gradient w-100"
                onClick={() => setIsChangingPassword(true)}
              >
                <i className="fas fa-edit me-2"></i>
                Change Password
              </button>
            ) : (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Current Password</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-lock text-muted"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">New Password</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-key text-muted"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 chars)"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Confirm Password</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-check text-muted"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                {message && (
                  <div className={`alert alert-${messageType === 'success' ? 'success' : 'danger'} alert-custom mb-3`}>
                    {message}
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-gradient flex-grow-1"
                    onClick={handleChangePassword}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Save New Password
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setMessage("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="divider"></div>

          {/* Logout Section */}
          <div className="settings-section">
            <h4>
              <i className="fas fa-sign-out-alt"></i>
              Session
            </h4>

            <button
              className="btn btn-outline-danger w-100"
              onClick={handleLogout}
            >
              <i className="fas fa-sign-out-alt me-2"></i>
              Logout
            </button>
          </div>

          <div className="divider"></div>

          {/* About Section */}
          <div className="settings-section">
            <h4>
              <i className="fas fa-info-circle"></i>
              About
            </h4>
            <div className="settings-item">
              <div>
                <div className="settings-label">AI Notes Summarizer</div>
                <small className="text-muted">v1.0.0 • Built with React & Firebase</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

