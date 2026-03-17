import api from "../services/api";
import { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import webSocketService from "../services/websocket";

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return width;
}

function AdminAppealDashboard() {
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth <= 768;
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    fetchAppeals();

    webSocketService.connect((client) => {
      webSocketService.subscribe("/topic/appeals", (newAppeal) => {
        fetchAppeals();
      });
    });

    return () => webSocketService.disconnect();
  }, []);

  const fetchAppeals = async () => {
    try {
      const res = await api.get("/appeals/all");
      console.log("Fetched appeals data:", res.data);
      setAppeals(res.data);
    } catch (error) {
      console.error("Failed to fetch appeals", error);
      // Demo data
      setAppeals([
        { id: 1, challanId: "CH001", reason: "I was not driving the vehicle at the time of violation. The car was with the mechanic for servicing.", status: "PENDING", vehicleNumber: "MH12AB1234", fineAmount: 1000, violationType: "Over Speeding", createdAt: "2024-02-01" },
        { id: 2, challanId: "CH002", reason: "The traffic signal was malfunctioning. I have video evidence to support my claim.", status: "PENDING", vehicleNumber: "MH14XY5678", fineAmount: 500, violationType: "Signal Jump", createdAt: "2024-02-02" },
        { id: 3, challanId: "CH003", reason: "Medical emergency - I was rushing my family member to the hospital.", status: "APPROVED", vehicleNumber: "MH20CD9876", fineAmount: 300, violationType: "Over Speeding", createdAt: "2024-02-03" },
        { id: 4, challanId: "CH004", reason: "Incorrect vehicle number recorded. My vehicle was not at that location.", status: "REJECTED", vehicleNumber: "MH09EF4321", fineAmount: 2000, violationType: "No License", createdAt: "2024-02-04" },
        { id: 5, challanId: "CH005", reason: "Parking zone marking was not visible due to construction work.", status: "PENDING", vehicleNumber: "MH15GH8765", fineAmount: 200, violationType: "Wrong Parking", createdAt: "2024-02-05" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id, decision) => {
    setProcessingId(id);
    try {
      await api.post(`/appeals/decision/${id}/${decision}`);
      showToast(`Appeal ${decision.toLowerCase()} successfully!`, "success");

      // Update local state
      setAppeals(appeals.map(a =>
        a.id === id ? { ...a, status: decision } : a
      ));
    } catch (error) {
      showToast("Failed to process appeal", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAppeals = appeals.filter(a => {
    if (filter === "all") return true;
    if (filter === "discarded") return a.challanStatus === "DISCARDED";
    if (filter === "approved") return a.status === "APPROVED" && a.challanStatus !== "DISCARDED";
    return a.status === filter.toUpperCase();
  });

  const getStatusStats = () => {
    return {
      total: appeals.length,
      pending: appeals.filter(a => a.status === "PENDING").length,
      approved: appeals.filter(a => a.status === "APPROVED" && a.challanStatus !== "DISCARDED").length,
      rejected: appeals.filter(a => a.status === "REJECTED").length,
      discarded: appeals.filter(a => a.challanStatus === "DISCARDED").length
    };
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <p>Loading appeals...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <h2 style={{ marginBottom: "0.5rem" }}>Appeals Management</h2>
        <p className="text-muted">Review and manage challan appeals from citizens.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-6 mb-6">
        <div className="stat-card primary" onClick={() => setFilter("all")} style={{ cursor: "pointer" }}>
          <div className="stat-card-icon">📋</div>
          <div className="stat-card-value">{stats.total}</div>
          <div className="stat-card-label">Total Appeals</div>
        </div>

        <div className="stat-card warning" onClick={() => setFilter("pending")} style={{ cursor: "pointer" }}>
          <div className="stat-card-icon">⏳</div>
          <div className="stat-card-value">{stats.pending}</div>
          <div className="stat-card-label">Pending Review</div>
        </div>

        <div className="stat-card success" onClick={() => setFilter("approved")} style={{ cursor: "pointer" }}>
          <div className="stat-card-icon">✅</div>
          <div className="stat-card-value">{stats.approved}</div>
          <div className="stat-card-label">Approved</div>
        </div>

        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setFilter("rejected")}>
          <div className="stat-card-icon" style={{ background: "rgba(244, 63, 94, 0.2)", color: "#f43f5e" }}>❌</div>
          <div className="stat-card-value">{stats.rejected}</div>
          <div className="stat-card-label">Rejected</div>
        </div>

        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setFilter("discarded")}>
          <div className="stat-card-icon" style={{ background: "rgba(107, 114, 128, 0.2)", color: "#9ca3af" }}>🗑️</div>
          <div className="stat-card-value">{stats.discarded}</div>
          <div className="stat-card-label">Discarded Challans</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {["all", "pending", "approved", "rejected", "discarded"].map((f) => (
          <button
            key={f}
            className={`btn ${filter === f ? "btn-primary" : "btn-ghost"} btn-sm`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Appeals List */}
      {filteredAppeals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">No Appeals Found</div>
          <div className="empty-state-text">
            {filter === "all"
              ? "There are no appeals to review at this time."
              : `No ${filter} appeals found.`}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredAppeals.map((appeal, index) => (
            <div
              key={appeal.id}
              className="appeal-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="appeal-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
                  <span className="appeal-id">#{appeal.challanId}</span>
                  <span className={`badge ${appeal.challanStatus === "DISCARDED" ? "badge-info" :
                    appeal.status === "APPROVED" ? "badge-success" :
                      appeal.status === "REJECTED" ? "badge-danger" : "badge-pending"
                    }`}>
                    {appeal.challanStatus === "DISCARDED" ? "DISCARDED" : appeal.status}
                  </span>
                </div>
                <span className="text-sm text-muted">
                  {appeal.createdAt ? new Date(appeal.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>

              {/* Appeal Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div className="violation-detail">
                  <span className="violation-detail-label">Vehicle Number</span>
                  <span className="violation-detail-value" style={{ fontFamily: "monospace" }}>
                    {appeal.vehicleNumber}
                  </span>
                </div>
                <div className="violation-detail">
                  <span className="violation-detail-label">Violation Type</span>
                  <span className="violation-detail-value">{appeal.violationType}</span>
                </div>
                <div className="violation-detail">
                  <span className="violation-detail-label">Fine Amount</span>
                  <span className="violation-detail-value" style={{ color: "var(--accent-amber)" }}>
                    ₹{appeal.fineAmount}
                  </span>
                </div>
                <div className="violation-detail">
                  <span className="violation-detail-label">Appeal ID</span>
                  <span className="violation-detail-value">APL-{String(appeal.id).padStart(4, '0')}</span>
                </div>
              </div>

              {/* Appeal Reason */}
              <div className="appeal-reason">
                <div className="text-sm text-muted mb-2">📝 Reason for Appeal:</div>
                <p style={{ color: "var(--neutral-200)", margin: 0 }}>{appeal.reason}</p>
              </div>

              {/* Action Buttons */}
              {appeal.status === "PENDING" && (
                <div className="appeal-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => handleDecision(appeal.id, "APPROVED")}
                    disabled={processingId === appeal.id}
                  >
                    {processingId === appeal.id ? "Processing..." : "✅ Approve Appeal"}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDecision(appeal.id, "REJECTED")}
                    disabled={processingId === appeal.id}
                  >
                    {processingId === appeal.id ? "Processing..." : "❌ Reject Appeal"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default AdminAppealDashboard;
