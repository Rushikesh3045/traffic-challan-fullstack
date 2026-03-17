import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Layout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username") || "User";
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("username");
        navigate("/login");
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    // Get navigation items based on current path (prioritize path for demo flexibility)
    const getNavItems = () => {
        if (location.pathname.startsWith("/admin")) {
            return [
                { path: "/admin", label: "Dashboard", icon: "📊" },
                { path: "/admin/appeals", label: "Appeals", icon: "📋" },
            ];
        } else if (location.pathname.startsWith("/police")) {
            return [
                { path: "/police", label: "Dashboard", icon: "🚔" },
            ];
        } else if (location.pathname.startsWith("/citizen")) {
            return [
                { path: "/citizen", label: "Dashboard", icon: "🏠" },
            ];
        } else {
            // Fallback to role if path is weird (e.g. /profile)
            if (role === "ROLE_ADMIN") return [{ path: "/admin", label: "Dashboard", icon: "📊" }];
            if (role === "ROLE_POLICE") return [{ path: "/police", label: "Dashboard", icon: "🚔" }];
            return [{ path: "/citizen", label: "Dashboard", icon: "🏠" }];
        }
    };

    const navItems = getNavItems();

    // Get role display name
    const getRoleDisplayName = () => {
        switch (role) {
            case "ROLE_ADMIN": return "Administrator";
            case "ROLE_POLICE": return "Police Officer";
            case "ROLE_CITIZEN": return "Citizen";
            default: return "User";
        }
    };

    return (
        <div className="layout">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={closeSidebar}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 99,
                        backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`} style={isSidebarOpen ? { display: 'flex', width: '280px', transform: 'translateX(0)' } : {}}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">🚦</div>
                        <span className="sidebar-logo-text">TrafficChallan</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Navigation</div>
                        {navItems.map((item) => (
                            <div
                                key={item.path}
                                className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
                                onClick={() => {
                                    navigate(item.path);
                                    closeSidebar();
                                }}
                            >
                                <span className="nav-link-icon">{item.icon}</span>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Quick Actions</div>
                        <div className="nav-link" onClick={handleLogout}>
                            <span className="nav-link-icon">🚪</span>
                            <span>Logout</span>
                        </div>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-card">
                        <div className="user-avatar">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{username}</div>
                            <div className="user-role">{getRoleDisplayName()}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Hamburger Menu for Mobile */}
                        <button
                            className="btn btn-ghost btn-icon mobile-menu-btn"
                            onClick={toggleSidebar}
                            style={{ display: 'none' }} // Controlled by CSS media queries ideally, but inline style as baseline
                        >
                            ☰
                        </button>

                        <div className="topbar-title">
                            <h1>
                                {location.pathname.startsWith("/admin") && "Admin Portal"}
                                {location.pathname.startsWith("/police") && "Police Portal"}
                                {location.pathname.startsWith("/citizen") && "Citizen Portal"}
                            </h1>
                            <p>Traffic Violation Management System</p>
                        </div>
                    </div>

                    <div className="topbar-actions">
                        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                            🚪 Logout
                        </button>
                    </div>
                </header>

                <div className="page-content">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default Layout;
