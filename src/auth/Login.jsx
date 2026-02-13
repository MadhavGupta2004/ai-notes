import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendSignInLinkToEmail } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export default function Login() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const isValidEmail = (e) => {
    if (!e) return false;
    const s = e.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(s);
  };

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const emailTrim = email?.trim();

    if (!emailTrim || !password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    if (!isValidEmail(emailTrim)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailTrim, password);
      const user = userCredential.user;
      
      // Firebase auth state will be updated automatically via onAuthStateChanged in App.jsx
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("Account not found. Please sign up.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Email/password sign-in is disabled in your Firebase project. Enable it under Authentication → Sign-in method.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many login attempts. Please try again later.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
      console.error("Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError("");
    setLoading(true);
    const emailTrim = email?.trim();

    if (!name || !emailTrim || !password) {
      setError("Please enter all fields.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (!isValidEmail(emailTrim)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailTrim, password);
      const user = userCredential.user;
      
      // Firebase auth state will be updated automatically via onAuthStateChanged in App.jsx
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Account already exists. Please login instead.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Sign-up is disabled in your Firebase project. Enable Email/Password provider under Authentication → Sign-in method.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else {
        setError(err.message || "Sign up failed. Please try again.");
      }
      console.error("Signup Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Firebase auth state will be updated automatically via onAuthStateChanged in App.jsx
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/popup-blocked") {
        setError("Pop-up was blocked. Please allow pop-ups and try again.");
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("Sign-in cancelled. Please try again.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Pop-up closed. Please try again.");
      } else {
        setError("Google sign-in failed. Please try again.");
      }
      console.error("Google Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");

    if (!forgotEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setResetSuccess(true);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many reset attempts. Please try again later.");
      } else {
        setError(err.message || "Failed to send reset email. Please try again.");
      }
      console.error("Password Reset Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async () => {
    setError("");
    const emailTrim = email?.trim();
    if (!emailTrim) {
      setError("Please enter your email to receive a sign-in link.");
      return;
    }

    if (!isValidEmail(emailTrim)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const actionCodeSettings = {
      // After clicking the link the user will be redirected back to /auth
      url: window.location.origin + '/auth',
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, emailTrim, actionCodeSettings);
      // Save the email locally to complete sign-in on this device if needed
      window.localStorage.setItem('emailForSignIn', email);
      setMagicLinkSent(true);
    } catch (err) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email link sign-in is disabled in your Firebase project. Enable it under Authentication → Sign-in method.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError(err.message || 'Failed to send sign-in link. Please try again.');
      }
      console.error('Magic Link Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      isLogin ? handleLogin() : handleSignup();
    }
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .login-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 450px;
          width: 100%;
          padding: 40px;
        }
        
        .logo-circle {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        
        .logo-circle i {
          font-size: 36px;
          color: white;
        }
        
        .form-control {
          border-radius: 10px;
          padding: 12px 15px;
          border: 1px solid #ddd;
          transition: all 0.3s;
        }
        
        .form-control:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }
        
        .input-group-text {
          background: transparent;
          border-right: none;
          border-radius: 10px 0 0 10px;
        }
        
        .input-group .form-control {
          border-left: none;
          border-radius: 0 10px 10px 0;
        }
        
        .btn-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 10px;
          padding: 12px;
          font-weight: 600;
          color: white;
          transition: all 0.3s;
        }
        
        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
          color: white;
        }
        
        .toggle-text {
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
        }
        
        .toggle-text:hover {
          color: #764ba2;
          text-decoration: underline;
        }
        
        .alert-custom {
          border-radius: 10px;
          border: none;
        }
      `}</style>

      <div className="login-container">
        <div className="login-card">
          {!showForgotPassword ? (
            <>
              <div className="text-center mb-4">
                <div className="logo-circle">
                  <i className="fas fa-robot"></i>
                </div>
                <h1 className="h3 mb-2">AI Notes Summarizer</h1>
                <p className="text-muted">
                  {isLogin ? 'Welcome back!' : 'Create your account'}
                </p>
              </div>

              {!isLogin && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold">Email</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-envelope text-muted"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Password</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-lock text-muted"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="••••••••"
                  />
                </div>
                {isLogin && (
                  <small 
                    className="toggle-text" 
                    style={{cursor: 'pointer', display: 'block', marginTop: '8px'}}
                    onClick={() => setShowForgotPassword(true)}
                  >
                    <i className="fas fa-redo me-1"></i>
                    Forgot Password?
                  </small>
                )}
              </div>

              {error && (
                <div className="alert alert-danger alert-custom mb-3">
                  {error}
                </div>
              )}

              <button
                className="btn btn-gradient w-100"
                onClick={isLogin ? handleLogin : handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {isLogin ? "Logging in..." : "Creating account..."}
                  </>
                ) : (
                  isLogin ? "Login" : "Sign Up"
                )}
              </button>

              <button
                onClick={handleGoogleLogin}
                className="btn btn-outline-dark w-100 mt-2"
                disabled={loading}
              >
                <i className="fab fa-google me-2"></i>
                Continue with Google
              </button>

              {isLogin && (
                <>
                  <button
                    onClick={handleSendMagicLink}
                    className="btn btn-outline-primary w-100 mt-2"
                    disabled={loading}
                  >
                    <i className="fas fa-link me-2"></i>
                    Send magic sign-in link
                  </button>

                  {magicLinkSent && (
                    <div className="alert alert-success alert-custom mt-3">
                      A sign-in link was sent to <strong>{email}</strong>. Check your email and open the link on the device where you want to sign in.
                    </div>
                  )}
                </>
              )}

              <p className="text-center mt-3 mb-0">
                {isLogin ? (
                  <>
                    Don't have an account?{" "}
                    <span onClick={() => setIsLogin(false)} className="toggle-text">
                      Sign up
                    </span>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <span onClick={() => setIsLogin(true)} className="toggle-text">
                      Login
                    </span>
                  </>
                )}
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-4">
                <div className="logo-circle">
                  <i className="fas fa-key"></i>
                </div>
                <h1 className="h3 mb-2">Reset Password</h1>
                <p className="text-muted">
                  {!resetSuccess 
                    ? "Enter your email to receive a temporary password"
                    : "Your temporary password is ready!"
                  }
                </p>
              </div>

              {!resetSuccess ? (
                <>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-envelope text-muted"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleForgotPassword();
                          }
                        }}
                        placeholder="you@example.com"
                        autoFocus
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="alert alert-danger alert-custom mb-3">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      {error}
                    </div>
                  )}

                  <button
                    className="btn btn-gradient w-100"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending email...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Send Reset Email
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="alert alert-success alert-custom mb-3">
                    <i className="fas fa-check-circle me-2"></i>
                    <strong>Email sent!</strong>
                  </div>

                  <div className="alert alert-info alert-custom mb-3">
                    <strong>📧 Check your email</strong>
                    <p className="mb-2 mt-2">
                      We've sent a password reset link to <strong>{forgotEmail}</strong>
                    </p>
                    <small className="text-muted">
                      Click the link to reset your password. If you don't see the email, check your spam folder.
                    </small>
                  </div>

                  <div className="alert alert-warning alert-custom mb-3">
                    <small>
                      <strong>💡 Tip:</strong> The link will expire in 1 hour. If you need a new reset link, just come back here.
                    </small>
                  </div>

                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError("");
                      setResetSuccess(false);
                      setForgotEmail("");
                    }}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Back to Login
                  </button>
                </>
              )}

              {!resetSuccess && (
                <p className="text-center mt-3 mb-0">
                  <span 
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError("");
                      setResetSuccess(false);
                      setForgotEmail("");
                    }} 
                    className="toggle-text"
                  >
                    <i className="fas fa-arrow-left me-1"></i>
                    Back to Login
                  </span>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}