import api from "../services/api";
import { useState, useEffect } from "react";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import webSocketService from "../services/websocket";

import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function CitizenDashboard() {
  const [vehicleNo, setVehicleNo] = useState(localStorage.getItem("vehicleNumber") || "");
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [appealReason, setAppealReason] = useState("");
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceImage, setEvidenceImage] = useState(null);
  const username = localStorage.getItem("username") || "Citizen";

  // New state for map modal
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const { showToast, ToastContainer } = useToast();

  const handleViewEvidence = (image) => {
    setEvidenceImage(image);
    setShowEvidenceModal(true);
  };

  const handleViewLocation = (violation) => {
    if (violation.gpsLatitude && violation.gpsLongitude) {
      setSelectedLocation([parseFloat(violation.gpsLatitude), parseFloat(violation.gpsLongitude)]);
      setShowMapModal(true);
    } else {
      showToast("GPS coordinates not available for this violation", "warning");
    }
  };

  useEffect(() => {
    // Auto-search if vehicle number was provided during registration/login
    const storedVehicle = localStorage.getItem("vehicleNumber");
    if (storedVehicle) {
      setSearched(true);
      setLoading(true);
      api.get("/violations/" + storedVehicle)
        .then(res => {
          setViolations(res.data);
          if (res.data.length === 0) {
            showToast("No violations found for your vehicle 🎉", "info");
          } else {
            showToast(`Found ${res.data.length} violation(s)`, "info");
          }
        })
        .catch(error => {
          console.error("Auto-search failed", error);
          showToast("Failed to fetch your violations", "error");
        })
        .finally(() => setLoading(false));
    }

    webSocketService.connect((client) => {
      webSocketService.subscribe("/topic/appeals/decision", (updatedAppeal) => {
        console.log("Appeal decision received:", updatedAppeal);

        // Update violations list with new appeal status
        setViolations(prev => prev.map(v => {
          if (v.id === updatedAppeal.challanId) {
            // Show notification based on decision
            let newStatus = v.status;
            if (updatedAppeal.status === "APPROVED") {
              showToast("🎉 Your appeal has been APPROVED! Fine has been discarded.", "success");
              newStatus = "DISCARDED";
            } else if (updatedAppeal.status === "REJECTED") {
              showToast("❌ Your appeal has been REJECTED. Please pay the fine.", "error");
              newStatus = "UNPAID";
            }
            return { ...v, status: newStatus, appealStatus: updatedAppeal.status };
          }
          return v;
        }));
      });
    });

    return () => webSocketService.disconnect();
  }, []);

  // Auto-refresh search results every 5 seconds if searched
  useEffect(() => {
    let intervalId;

    if (searched && vehicleNo) {
      intervalId = setInterval(async () => {
        try {
          // Silent refresh
          const res = await api.get("/violations/" + vehicleNo);
          setViolations(res.data);
        } catch (error) {
          console.error("Auto-refresh failed", error);
        }
      }, 5000);
    }

    return () => clearInterval(intervalId);
  }, [searched, vehicleNo]);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!vehicleNo.trim()) {
      showToast("Please enter a vehicle number", "error");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get("/violations/" + vehicleNo);
      setViolations(res.data);
      if (res.data.length === 0) {
        showToast("No violations found for this vehicle 🎉", "info");
      } else {
        showToast(`Found ${res.data.length} violation(s)`, "info");
      }
    } catch (error) {
      console.error("Search failed", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch violations. Please ensure the backend is running.";
      showToast(errorMessage, "error");
      setViolations([]); // Clear violations on error instead of showing demo data
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id) => {
    setProcessingId(id);
    try {
      const response = await api.post(`/payments/pay/${id}`);
      showToast("Payment Successful! 🎉", "success");

      // Update local state
      setViolations(violations.map(v =>
        v.id === id ? { ...v, status: "PAID", paidAt: response.data?.violation?.paidAt || new Date().toISOString() } : v
      ));
    } catch (error) {
      console.error("Payment failed:", error);

      // Specific error messages
      if (error.response?.status === 401) {
        showToast("❌ Please login again to make payment", "error");
      } else if (error.response?.status === 403) {
        showToast("❌ Access denied. Please login as Citizen.", "error");
      } else {
        const errorMessage = error.response?.data?.message || error.response?.data || "Payment failed. Please try again.";
        showToast(errorMessage, "error");
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownloadReceipt = (id) => {
    const violation = violations.find(v => v.id === id);
    if (!violation) return;

    const doc = new jsPDF();

    // Add Logo/Header
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // Navy Blue
    doc.text("TRAFFIC POLICE DEPARTMENT", 105, 20, null, null, "center");

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text("OFFICIAL PAYMENT RECEIPT", 105, 30, null, null, "center");

    // Add Decorative Line
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(1);
    doc.line(20, 35, 190, 35);

    // Paid Stamp Effect
    doc.setDrawColor(16, 185, 129); // Emerald Green
    doc.setLineWidth(0.5);
    doc.rect(155, 45, 35, 15);
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text("PAID", 172.5, 55, null, null, "center");

    // Initial Y position
    let y = 50;

    // Receipt Details
    const details = [
      ["Receipt Number", `REC-${violation.id.toString().padStart(6, '0')}`],
      ["Date Issued", violation.createdAt || new Date().toLocaleDateString()],
      ["Payment Date", violation.paidAt || new Date().toLocaleDateString()],
      ["Vehicle Number", violation.vehicleNumber],
      ["Violation Type", violation.violationType],
      ["Location", violation.location || "N/A"],
      ["Status", "SUCCESSFUL"]
    ];

    autoTable(doc, {
      startY: y,
      head: [['FIELD', 'DETAILS']],
      body: details,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: 'bold', width: 50, fillColor: [240, 240, 240] } }
    });

    y = doc.lastAutoTable.finalY + 15;

    // Add Evidence Image if available
    if (violation.evidenceImage && violation.evidenceImage.startsWith("data:image")) {
      try {
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text("VIOLATION EVIDENCE (PHOTO PROOF):", 20, y);
        y += 5;
        doc.addImage(violation.evidenceImage, 'JPEG', 20, y, 80, 60);
        y += 70;
      } catch (e) {
        console.error("Failed to add image to PDF", e);
      }
    }

    // Amount Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Fine Amount Paid: Rs. ${violation.fineAmount}/-`, 190, y, null, null, "right");

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    const footerY = 280;
    doc.text("This is an electronically generated receipt issued by the Traffic Management System.", 105, footerY, null, null, "center");
    doc.text("Safe Driving Saves Lives. © 2026 Traffic Controller App", 105, footerY + 5, null, null, "center");

    // Save PDF
    doc.save(`Challan_Receipt_${violation.vehicleNumber}.pdf`);
    showToast("Receipt downloaded successfully! 📄", "success");
  };

  const openAppealModal = (violation) => {
    setSelectedViolation(violation);
    setAppealReason("");
    setShowAppealModal(true);
  };

  const handleSubmitAppeal = async () => {
    if (!appealReason.trim()) {
      showToast("Please provide a reason for your appeal", "error");
      return;
    }

    try {
      await api.post("/appeals", {
        challanId: selectedViolation.id,
        reason: appealReason
      });
      showToast("Appeal submitted successfully!", "success");

      // Update local state
      setViolations(violations.map(v =>
        v.id === selectedViolation.id ? { ...v, status: "APPEALED", appealStatus: "PENDING" } : v
      ));
      setShowAppealModal(false);


    } catch (error) {
      console.error("Appeal submission failed:", error);

      // Specific error messages
      if (error.response?.status === 401) {
        showToast("❌ Please login again to submit appeal", "error");
      } else if (error.response?.status === 403) {
        showToast("❌ Access denied. Please login as Citizen.", "error");
      } else {
        const errorMessage = error.response?.data?.message || "Failed to submit appeal. Please try again.";
        showToast(errorMessage, "error");
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "DISCARDED":
        return <span className="badge badge-success" style={{ background: "rgba(107, 114, 128, 0.2)", color: "#9ca3af" }}>✅ Discarded</span>;
      case "PAID":
        return <span className="badge badge-success">✅ Paid</span>;
      case "UNPAID":
        return <span className="badge badge-danger">⏳ Unpaid</span>;
      case "APPEALED":
        return <span className="badge badge-pending">📋 Appealed</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const getTotalUnpaid = () => {
    return violations.filter(v => v.status === "UNPAID").reduce((sum, v) => sum + v.fineAmount, 0);
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* User Avatar */}
            <div style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              fontWeight: "700",
              color: "#fff",
              boxShadow: "0 0 16px rgba(102, 126, 234, 0.5)",
              flexShrink: 0
            }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ marginBottom: "0.2rem" }}>
                Welcome back, <span style={{
                  background: "linear-gradient(135deg, #667eea, #a78bfa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}>{username}</span>! 👋
              </h2>
              <p className="text-muted">Search and manage your traffic violations below.</p>
            </div>
          </div>
          {/* Vehicle Badge */}
          {localStorage.getItem("vehicleNumber") && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: "rgba(16, 185, 129, 0.1)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(16, 185, 129, 0.3)"
            }}>
              <span style={{ fontSize: "1rem" }}>🚗</span>
              <span style={{ fontSize: "0.875rem", color: "var(--accent-emerald)", fontWeight: "600", fontFamily: "monospace" }}>
                {localStorage.getItem("vehicleNumber")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search Section */}
      <div className="card mb-6">
        <form onSubmit={handleSearch}>
          <div className="search-box">
            <span style={{ fontSize: "1.5rem", marginLeft: "0.5rem" }}>🔍</span>
            <input
              type="text"
              placeholder="Enter Vehicle Number (e.g., MH12AB1234)"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
              style={{
                textTransform: "uppercase",
                fontFamily: "monospace",
                fontSize: "1.1rem"
              }}
              disabled={loading || !!localStorage.getItem("vehicleNumber")}
            />
            {!localStorage.getItem("vehicleNumber") && (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            )}
            {!!localStorage.getItem("vehicleNumber") && (
              <button
                type="button"
                className="btn btn-primary"
                disabled
                title="Vehicle number is locked to your account"
              >
                Locked 🔒
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Results Section */}
      {searched && (
        <>
          {/* Summary Cards */}
          {violations.length > 0 && (
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="stat-card primary">
                <div className="stat-card-icon">📋</div>
                <div className="stat-card-value">{violations.length}</div>
                <div className="stat-card-label">Total Violations</div>
              </div>

              <div className="stat-card success">
                <div className="stat-card-icon">✅</div>
                <div className="stat-card-value">{violations.filter(v => v.status === "PAID").length}</div>
                <div className="stat-card-label">Paid</div>
              </div>

              <div className="stat-card warning">
                <div className="stat-card-icon">⏳</div>
                <div className="stat-card-value">{violations.filter(v => v.status === "UNPAID").length}</div>
                <div className="stat-card-label">Unpaid</div>
              </div>

              <div className="stat-card info">
                <div className="stat-card-icon">💰</div>
                <div className="stat-card-value">₹{getTotalUnpaid().toLocaleString()}</div>
                <div className="stat-card-label">Total Due</div>
              </div>
            </div>
          )}

          {/* Violations List */}
          {violations.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state-icon">🎉</div>
              <div className="empty-state-title">No Violations Found!</div>
              <div className="empty-state-text">
                Great news! No traffic violations found for vehicle number <strong>{vehicleNo}</strong>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {violations.map((violation, index) => (
                <div
                  key={violation.id}
                  className="violation-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="violation-header">
                    <div>
                      <div className="violation-type">{violation.violationType}</div>
                      <div className="text-sm text-muted mt-1">📍 {violation.location || "Location not recorded"}</div>
                    </div>
                    <div className="violation-amount">₹{violation.fineAmount}</div>
                  </div>

                  <div className="violation-details">
                    <div className="violation-detail">
                      <span className="violation-detail-label">Issue Date</span>
                      <span className="violation-detail-value">
                        {violation.createdAt ? new Date(violation.createdAt).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    {violation.status === 'PAID' ? (
                      <div className="violation-detail">
                        <span className="violation-detail-label">Paid On</span>
                        <span className="violation-detail-value">
                          {violation.paidAt ? new Date(violation.paidAt).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    ) : violation.status === 'DISCARDED' ? (
                      <div className="violation-detail">
                        <span className="violation-detail-label">Discarded</span>
                        <span className="violation-detail-value" style={{ color: "#9ca3af" }}>✓ Waived</span>
                      </div>
                    ) : (
                      <div className="violation-detail">
                        <span className="violation-detail-label">Due Date</span>
                        <span className="violation-detail-value" style={{ color: "var(--accent-rose)", fontWeight: "600" }}>
                          {violation.createdAt ? new Date(new Date(violation.createdAt).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    )}
                    <div className="violation-detail">
                      <span className="violation-detail-label">Status</span>
                      {getStatusBadge(violation.status)}
                    </div>
                  </div>

                  <div className="violation-actions">
                    {/* View Location Button */}
                    {(violation.gpsLatitude && violation.gpsLongitude) || violation.location ? (
                      <button
                        className="btn btn-ghost"
                        onClick={() => handleViewLocation(violation)}
                        style={{ color: 'var(--accent-sky)', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                      >
                        📍 View Location
                      </button>
                    ) : null}

                    {violation.status === "UNPAID" && (
                      <>
                        <button
                          className="btn btn-success"
                          onClick={() => handlePay(violation.id)}
                          disabled={processingId === violation.id}
                        >
                          {processingId === violation.id ? "Processing..." : "💳 Pay Now"}
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => openAppealModal(violation)}
                        >
                          📝 Appeal
                        </button>
                      </>
                    )}
                    {violation.status === "PAID" && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleDownloadReceipt(violation.id)}
                      >
                        📄 Download Receipt
                      </button>
                    )}
                    {violation.evidenceImage ? (
                      <button
                        className="btn btn-info"
                        onClick={() => handleViewEvidence(violation.evidenceImage)}
                        style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                      >
                        📸 Proof
                      </button>
                    ) : null}

                    {/* Appeal Status Banner */}
                    {violation.status === "APPEALED" && (
                      <div style={{
                        padding: "0.5rem",
                        background: "rgba(139, 92, 246, 0.1)",
                        borderRadius: "var(--radius-lg)",
                        color: "var(--accent-violet)",
                        fontSize: "0.80rem",
                        width: '100%',
                        textAlign: 'center',
                        marginTop: '0.5rem'
                      }}>
                        ⏳ Appeal Under Review
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Initial State */}
      {!searched && (
        <div className="empty-state card">
          <div className="empty-state-icon">🚗</div>
          <div className="empty-state-title">Search for Violations</div>
          <div className="empty-state-text">
            Enter your vehicle number above to check for any pending traffic violations
          </div>
        </div>
      )}

      {/* Appeal Modal */}
      <Modal
        isOpen={showAppealModal}
        onClose={() => setShowAppealModal(false)}
        title="📝 File an Appeal"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', width: '100%' }}>
            <button className="btn btn-ghost" onClick={() => setShowAppealModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmitAppeal}>
              Submit Appeal
            </button>
          </div>
        }
      >
        {/* ... Appeal Modal Content ... */}
        {selectedViolation && (
          <div className="flex flex-col gap-4">
            {/* ... existing content ... */}
            <div className="card-glass p-4" style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>{selectedViolation.violationType}</span>
                <span style={{ color: "var(--accent-amber)", fontWeight: "700" }}>
                  ₹{selectedViolation.fineAmount}
                </span>
              </div>
              <div className="text-sm text-muted">📍 {selectedViolation.location || "Location not recorded"}</div>
            </div>

            <div className="input-group">
              <label htmlFor="appealReason" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Reason for Appeal *</label>
              <textarea
                id="appealReason"
                className="input"
                placeholder="Please explain why you believe this challan should be reconsidered..."
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                style={{ minHeight: "120px", resize: "vertical", width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
            </div>

            <p className="text-sm text-muted" style={{ fontSize: '0.875rem', opacity: 0.7 }}>
              💡 <strong>Tip:</strong> Provide as much detail as possible to support your appeal.
              Include any evidence or circumstances that may be relevant.
            </p>
          </div>
        )}
      </Modal>

      {/* Evidence Modal */}
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

      {/* Map Modal */}
      <Modal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        title="📍 Violation Location"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-primary" onClick={() => setShowMapModal(false)}>
              Close
            </button>
          </div>
        }
      >
        <div style={{ height: '400px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}>
          {selectedLocation && (
            <MapContainer center={selectedLocation} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={selectedLocation}>
                <Popup>
                  Challan Issued Here
                </Popup>
              </Marker>
            </MapContainer>
          )}
        </div>
      </Modal>

      <ToastContainer />
    </div>
  );
}

export default CitizenDashboard;
