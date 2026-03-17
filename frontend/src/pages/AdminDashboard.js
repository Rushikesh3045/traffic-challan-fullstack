import api from "../services/api";
import { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart
} from "recharts";

import TrafficMap from "../components/TrafficMap";
import Modal from "../components/Modal";
import webSocketService from "../services/websocket";

// Hook to detect screen width for responsive adjustments
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return width;
}

function AdminDashboard() {
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth <= 1024;
  const chartHeight = isMobile ? 180 : 280;
  const mapHeight = isMobile ? 220 : isTablet ? 300 : 400;
  const [data, setData] = useState({
    totalViolations: 0,
    paidChallans: 0,
    unpaidChallans: 0,
    totalCollection: 0,
    pendingAppeals: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentViolations, setRecentViolations] = useState([]);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceImage, setEvidenceImage] = useState(null);
  const { showToast, ToastContainer } = useToast();

  const handleViewEvidence = (image) => {
    setEvidenceImage(image);
    setShowEvidenceModal(true);
  };

  useEffect(() => {
    fetchDashboardData();

    // Polling fallback - refresh every 5 seconds
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 5000);

    webSocketService.connect((client) => {
      // Listen for new violations
      webSocketService.subscribe("/topic/violations", (newViolation) => {
        console.log("New violation received:", newViolation);
        showToast(`🚨 New violation recorded: ${newViolation.violationType}`, "info");
        fetchDashboardData(); // Refresh all stats
      });

      // Listen for new appeals
      webSocketService.subscribe("/topic/appeals", (newAppeal) => {
        console.log("New appeal received:", newAppeal);
        showToast("📋 New appeal submitted", "info");
        fetchDashboardData();
      });

      // Listen for appeal decisions
      webSocketService.subscribe("/topic/appeals/decision", (decision) => {
        console.log("Appeal decision:", decision);
        showToast(`✅ Appeal ${decision.status}`, "success");
        fetchDashboardData();
      });
    });

    return () => {
      clearInterval(intervalId); // Cleanup interval
      webSocketService.disconnect();
    };
  }, []);

  const handleAddLateFee = async (id) => {
    try {
      if (!window.confirm("Are you sure you want to add a 10% late fee to this challan?")) return;

      await api.post(`/admin/add-late-fee/${id}`);
      showToast("Late fee applied successfully!", "success");
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to apply late fee", error);
      showToast("Failed to apply late fee", "error");
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await api.get("/admin/dashboard");
      setData(res.data);

      const recentRes = await api.get("/admin/recent-violations");
      setRecentViolations(recentRes.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: "Paid", value: data.paidChallans || 0 },
    { name: "Unpaid", value: data.unpaidChallans || 0 }
  ];

  const COLORS = ["#10b981", "#f43f5e"];

  // Use real monthly stats if available, otherwise empty array
  const monthlyData = data.monthlyStats && data.monthlyStats.length > 0
    ? data.monthlyStats
    : [];

  // Use real violation stats if available, otherwise empty array
  const violationTypes = data.violationStats && data.violationStats.length > 0
    ? data.violationStats
    : [];

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          flexWrap: "wrap",
          gap: "0.75rem"
        }}>
          <div>
            <h2 style={{ marginBottom: "0.5rem" }}>Dashboard Overview</h2>
            <p className="text-muted">Welcome! Here's what's happening with your traffic system.</p>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            background: "rgba(16, 185, 129, 0.1)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            flexShrink: 0
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
              animation: "pulse 2s infinite"
            }}></div>
            <span style={{ fontSize: "0.875rem", color: "var(--accent-emerald)", fontWeight: "500", whiteSpace: "nowrap" }}>
              {isMobile ? "Live" : "Live Updates (Auto-refresh)"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="stat-card primary">
          <div className="stat-card-icon">📊</div>
          <div className="stat-card-value">{data.totalViolations}</div>
          <div className="stat-card-label">Total Violations</div>
        </div>

        <div className="stat-card success">
          <div className="stat-card-icon">✅</div>
          <div className="stat-card-value">{data.paidChallans}</div>
          <div className="stat-card-label">Paid Challans</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-card-icon">⏳</div>
          <div className="stat-card-value">{data.unpaidChallans}</div>
          <div className="stat-card-label">Unpaid Challans</div>
        </div>

        <div className="stat-card info">
          <div className="stat-card-icon">💰</div>
          <div className="stat-card-value">₹{(data.totalCollection).toLocaleString()}</div>
          <div className="stat-card-label">Total Collection</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Monthly Violations Trend */}
        <div className="chart-container" style={{ minHeight: `${chartHeight + 60}px` }}>
          <div className="chart-header">
            <h3 className="chart-title">📈 Monthly Violations Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#fff"
                }}
              />
              <Area
                type="monotone"
                dataKey="violations"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorViolations)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Status Pie Chart */}
        <div className="chart-container" style={{ minHeight: `${chartHeight + 60}px` }}>
          <div className="chart-header">
            <h3 className="chart-title">🥧 Payment Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 35 : 60}
                outerRadius={isMobile ? 65 : 100}
                paddingAngle={5}
                dataKey="value"
                label={isMobile ? undefined : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px"
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Violation Types Bar Chart */}
        <div className="chart-container" style={{ minHeight: `${chartHeight + 60}px` }}>
          <div className="chart-header">
            <h3 className="chart-title">📊 Violation Types</h3>
          </div>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={violationTypes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" width={isMobile ? 70 : 100} />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px"
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Collection Trend (Bar Chart) */}
        <div className="chart-container" style={{ minHeight: `${chartHeight + 60}px` }}>
          <div className="chart-header">
            <h3 className="chart-title">💵 Collection Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#fff"
                }}
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                formatter={(value) => [`₹${value.toLocaleString()}`, "Collection"]}
              />
              <Bar dataKey="collection" fill="#10b981" radius={[4, 4, 0, 0]} barSize={isMobile ? 20 : 40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* Real-time Traffic Map */}
      <div className="mb-6" style={{
        height: `${mapHeight}px`,
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <TrafficMap violations={recentViolations} />
      </div>

      {/* Recent Violations Table */}
      <div className="chart-container" style={{ overflowX: 'auto' }}>
        <div className="chart-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 className="chart-title">🚗 Recent Violations</h3>
          <button className="btn btn-ghost btn-sm">View All →</button>
        </div>
        <div className="table-container" style={{ border: "none" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Vehicle No.</th>
                <th>Violation Type</th>
                <th>Fine Amount</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentViolations.map((violation) => (
                <tr key={violation.id}>
                  <td>
                    <span style={{ fontFamily: "monospace", fontWeight: "600" }}>
                      {violation.vehicleNumber}
                    </span>
                  </td>
                  <td>
                    {violation.violationType}
                    {violation.gpsLatitude && (
                      <span title="GPS Location Verified" style={{ marginLeft: "8px", cursor: "help" }}>📍</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: "600", color: "var(--accent-amber)" }}>
                      ₹{violation.fineAmount}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.875rem", color: "var(--neutral-400)" }}>
                      {violation.createdAt ? new Date(violation.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${violation.status === "PAID" ? "badge-success" :
                      violation.status === "DISCARDED" ? "badge-info" :
                        violation.status === "APPEALED" ? "badge-pending" : "badge-danger"
                      }`}>
                      {violation.status}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {violation.evidenceImage ? (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleViewEvidence(violation.evidenceImage)}
                        title="View Evidence"
                      >
                        📸
                      </button>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.8rem', alignSelf: 'center' }}>No Proof</span>
                    )}
                    {violation.status === "UNPAID" && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleAddLateFee(violation.id)}
                        title="Add 10% Late Fee"
                      >
                        ⏱️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showEvidenceModal}
        onClose={() => setShowEvidenceModal(false)}
        title="📸 Violation Evidence"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-primary" onClick={() => setShowEvidenceModal(false)}>
              Close
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', justifyContent: 'center', background: '#000', borderRadius: '0.5rem', overflow: 'hidden' }}>
          {evidenceImage ? (
            <img src={evidenceImage} alt="Violation Proof" style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
          ) : (
            <p style={{ padding: '2rem', color: '#fff' }}>No image data available</p>
          )}
        </div>
      </Modal>

      <ToastContainer />
    </div >
  );
}

export default AdminDashboard;
