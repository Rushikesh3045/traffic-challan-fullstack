import api from "../services/api";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";

function Register() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "ROLE_CITIZEN",
        vehicleNumber: ""
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showToast, ToastContainer } = useToast();

    const handleRegister = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.username || !formData.email || !formData.password) {
            showToast("Please fill in all required fields", "error");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            showToast("Passwords do not match", "error");
            return;
        }

        if (formData.password.length < 6) {
            showToast("Password must be at least 6 characters", "error");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/register", {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                ...(formData.role === "ROLE_CITIZEN" && { vehicleNumber: formData.vehicleNumber })
            });

            showToast("Registration successful! Please login.", "success");
            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (error) {
            const message = error.response?.data?.message || "Registration failed. Please try again.";
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

            {/* Register Card */}
            <div className="auth-card" style={{ maxWidth: "480px" }}>
                {/* Logo */}
                <div className="auth-logo">
                    <div className="auth-logo-icon">🚦</div>
                    <span className="auth-logo-text">TrafficChallan</span>
                </div>

                <h2 className="auth-title">Create Account</h2>
                <p className="auth-subtitle">Join the Traffic Violation Management System</p>

                <form className="auth-form" onSubmit={handleRegister}>
                    <div className="input-group">
                        <label htmlFor="username">Username *</label>
                        <input
                            id="username"
                            type="text"
                            className="input"
                            placeholder="Choose a username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            disabled={loading}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email Address *</label>
                        <input
                            id="email"
                            type="email"
                            className="input"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label htmlFor="password">Password *</label>
                            <input
                                id="password"
                                type="password"
                                className="input"
                                placeholder="Create password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                disabled={loading}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="confirmPassword">Confirm Password *</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="input"
                                placeholder="Confirm password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="role">Account Type</label>
                        <select
                            id="role"
                            className="select"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            disabled={loading}
                        >
                            <option value="ROLE_CITIZEN">👤 Citizen</option>
                            <option value="ROLE_POLICE">🚔 Police Officer</option>
                        </select>
                    </div>

                    {formData.role === "ROLE_CITIZEN" && (
                        <div className="input-group">
                            <label htmlFor="vehicleNumber">Vehicle Registration Number</label>
                            <input
                                id="vehicleNumber"
                                type="text"
                                className="input"
                                placeholder="e.g. MH12AB1234"
                                value={formData.vehicleNumber}
                                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                                disabled={loading}
                                style={{ textTransform: "uppercase" }}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={loading}
                        style={{ marginTop: "0.5rem" }}
                    >
                        {loading ? (
                            <>
                                <span className="loading-spinner" style={{ width: "20px", height: "20px", borderWidth: "2px" }}></span>
                                Creating Account...
                            </>
                        ) : (
                            <>
                                ✨ Create Account
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-divider">or</div>

                <div className="auth-footer">
                    Already have an account?{" "}
                    <Link to="/login">Sign In</Link>
                </div>
            </div>

            <ToastContainer />
        </div>
    );
}

export default Register;
