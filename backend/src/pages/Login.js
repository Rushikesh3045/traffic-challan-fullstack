import api from "../services/api";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";

function Login() {
  const [user, setUser] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!user.username || !user.password) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", user);

      // Store token and user info
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("username", user.username);
      if (res.data.vehicleNumber) {
        localStorage.setItem("vehicleNumber", res.data.vehicleNumber);
      }

      showToast("Login successful! Redirecting...", "success");

      // Redirect based on role
      setTimeout(() => {
        if (res.data.role === "ROLE_ADMIN") {
          navigate("/admin");
        } else if (res.data.role === "ROLE_POLICE") {
          navigate("/police");
        } else {
          navigate("/citizen");
        }
      }, 1000);
    } catch (error) {
      const message = error.response?.data?.message || "Login failed. Please check your credentials.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Animated Background */}
      <div className="auth-bg">
        <div className="auth-bg-gradient auth-bg-gradient-1"></div>
        <div className="auth-bg-gradient auth-bg-gradient-2"></div>
        <div className="auth-bg-gradient auth-bg-gradient-3"></div>
      </div>

      {/* Login Card */}
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🚦</div>
          <span className="auth-logo-text">TrafficChallan</span>
        </div>

        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="input"
              placeholder="Enter your username"
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="Enter your password"
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            style={{ marginTop: "0.5rem" }}
          >
            {loading ? (
              <>
                <span className="loading-spinner" style={{ width: "20px", height: "20px", borderWidth: "2px" }}></span>
                Signing in...
              </>
            ) : (
              <>
                🔐 Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <div className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">Create Account</Link>
        </div>


      </div>

      <ToastContainer />
    </div>
  );
}

export default Login;
