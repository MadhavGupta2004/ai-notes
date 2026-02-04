import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export default function Login() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.email === email);

    if (!user) {
      setError("Account not found. Please sign up.");
      return;
    }

    if (user.password !== password) {
      setError("Incorrect password. Please try again.");
      return;
    }

    // Success
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", user.email);
    navigate("/dashboard");
  };

  const handleSignup = () => {
    setError("");

    if (!name || !email || !password) {
      setError("Please enter all fields.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userExists = users.find(u => u.email === email);
    
    if (userExists) {
      setError("Account already exists. Please login.");
      return;
    }

    users.push({ name, email, password });
    localStorage.setItem("users", JSON.stringify(users));

    // Auto login after signup
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", email);
    navigate("/dashboard");
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", user.email);
      navigate("/dashboard");
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
      console.error(err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
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
          </div>

          {error && (
            <div className="alert alert-danger alert-custom mb-3">
              {error}
            </div>
          )}

          <button
            className="btn btn-gradient w-100"
            onClick={isLogin ? handleLogin : handleSignup}
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>

          <button
            onClick={handleGoogleLogin}
            className="btn btn-outline-dark w-100 mt-2"
          >
            <i className="fab fa-google me-2"></i>
            Continue with Google
          </button>

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
        </div>
      </div>
    </>
  );
}