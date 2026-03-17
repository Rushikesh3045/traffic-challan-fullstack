import api from "../services/api";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

import webSocketService from "../services/websocket";
import LiveEvidenceCamera from "../components/LiveEvidenceCamera";
import LiveLocationMap from "../components/LiveLocationMap";

function PoliceDashboard() {
  const [violation, setViolation] = useState({
    vehicleNumber: "",
    violationType: "",
    fineAmount: "",
    location: "",
    description: "",
    gpsLatitude: "",
    gpsLongitude: "",
    evidenceImage: ""
  });
  const [loading, setLoading] = useState(false);
  const [refreshLocation, setRefreshLocation] = useState(0);
  const [recentEntries, setRecentEntries] = useState([]);
  const [otherSelected, setOtherSelected] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const fetchRecentViolations = async () => {
    try {
      const res = await api.get("/violations/recent");
      const mapped = res.data.map(v => ({
        id: v.id,
        vehicleNumber: v.vehicleNumber,
        violationType: v.violationType,
        fineAmount: v.fineAmount,
        time: v.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
      }));
      setRecentEntries(mapped);
    } catch (error) {
      console.error("Failed to fetch recent violations", error);
    }
  };

  const handleImageCaptured = useCallback((imageSrc) => {
    setViolation(prev => ({ ...prev, evidenceImage: imageSrc }));
  }, []);

  const handleLocationFound = useCallback((lat, lng) => {
    // Round to 6 decimal places for consistency
    const fixedLat = lat.toFixed(6);
    const fixedLng = lng.toFixed(6);

    // Update coordinates in state
    setViolation(prev => {
      // If coordinates haven't changed much, don't trigger a full state update
      // this prevents unnecessary re-renders and address refetches
      if (prev.gpsLatitude === fixedLat && prev.gpsLongitude === fixedLng && prev.location) {
        return prev;
      }

      return {
        ...prev,
        gpsLatitude: fixedLat,
        gpsLongitude: fixedLng
      };
    });

    // Then try to fetch the readable address
    const fetchAddress = async () => {
      try {
        // Use a descriptive User-Agent for Nominatim
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await response.json();

        if (data && data.display_name) {
          setViolation(prev => ({
            ...prev,
            location: data.display_name
          }));
        } else {
          // Only set coordinates as location if no name is found
          setViolation(prev => ({
            ...prev,
            location: `📍 Lat: ${fixedLat}, Lng: ${fixedLng}`
          }));
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        // Fallback to coordinates on error if location isn't already set
        setViolation(prev => ({
          ...prev,
          location: prev.location || `📍 Lat: ${fixedLat}, Lng: ${fixedLng}`
        }));
      }
    };

    fetchAddress();
  }, []);

  useEffect(() => {
    fetchRecentViolations();

    webSocketService.connect((client) => {
      webSocketService.subscribe("/topic/violations", (newViolation) => {
        console.log("New violation broadcasted:", newViolation);

        // Add to recent entries if not already there (id check)
        setRecentEntries(prev => {
          // Check if this violation is already in the list
          if (prev.find(e => e.id === newViolation.id)) return prev;

          const entry = {
            id: newViolation.id,
            vehicleNumber: newViolation.vehicleNumber,
            violationType: newViolation.violationType,
            fineAmount: newViolation.fineAmount,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          // Keep only the 5 most recent entries
          return [entry, ...prev].slice(0, 5);
        });
      });
    });

    const intervalId = setInterval(() => {
      fetchRecentViolations();
    }, 5000);

    return () => {
      webSocketService.disconnect();
      clearInterval(intervalId);
    };
  }, []);

  const violationTypes = [
    { type: "Over Speeding", amount: 1000, icon: "🏎️" },
    { type: "Signal Jump", amount: 500, icon: "🚦" },
    { type: "No Helmet", amount: 300, icon: "⛑️" },
    { type: "Wrong Parking", amount: 200, icon: "🅿️" },
    { type: "No License", amount: 2000, icon: "🪪" },
    { type: "No Seat Belt", amount: 500, icon: "🔗" },
    { type: "Using Phone", amount: 1500, icon: "📱" },
    { type: "Drunk Driving", amount: 5000, icon: "🍺" },
    { type: "No Insurance", amount: 1000, icon: "📄" },
    { type: "Overloading", amount: 2000, icon: "📦" },
    { type: "Other", amount: "", icon: "📝" },
  ];

  const handleQuickSelect = (type) => {
    if (type.type === "Other") {
      setOtherSelected(prev => !prev);
      setTimeout(() => document.getElementById("violationType")?.focus(), 0);
      return;
    }

    setViolation((prev) => {
      let currentTypes = prev.violationType ? prev.violationType.split(", ") : [];
      let newTypes = [...currentTypes];
      let newAmount = Number(prev.fineAmount) || 0;

      if (newTypes.includes(type.type)) {
        // Remove violation
        newTypes = newTypes.filter((t) => t !== type.type);
        newAmount -= type.amount;
      } else {
        // Add violation
        newTypes.push(type.type);
        newAmount += type.amount;
      }

      return {
        ...prev,
        violationType: newTypes.join(", "),
        fineAmount: newAmount > 0 ? newAmount : ""
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!violation.vehicleNumber || !violation.violationType || !violation.fineAmount) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      const violationData = {
        ...violation,
        fineAmount: Number(violation.fineAmount) // Convert to number
      };

      const response = await api.post("/violations", violationData);
      showToast("Violation recorded successfully!", "success");

      // Add to recent entries
      const newEntry = {
        id: response.data.id || Date.now(),
        vehicleNumber: violation.vehicleNumber,
        violationType: violation.violationType,
        fineAmount: violation.fineAmount,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setRecentEntries([newEntry, ...recentEntries.slice(0, 4)]);

      // Delay fetch slightly to ensure backend commit
      setTimeout(() => fetchRecentViolations(), 500);

      // Reset form
      setViolation({
        vehicleNumber: "",
        violationType: "",
        fineAmount: "",
        location: "",
        description: "",
        gpsLatitude: "",
        gpsLongitude: "",
        evidenceImage: ""
      });
      setOtherSelected(false);
      setRefreshLocation(prev => prev + 1); // Trigger new location fetch
    } catch (error) {
      console.error("Violation recording error:", error);
      const message = error.response?.data?.message || "Failed to record violation";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <h2 style={{ marginBottom: "0.5rem" }}>🚔 Record New Violation</h2>
        <p className="text-muted">Issue a traffic violation challan to the vehicle owner.</p>
      </div>


      <div className="grid grid-cols-3 gap-6">
        {/* Main Content Area (Left - 2 Columns) */}
        <div className="col-span-2 flex flex-col gap-6">

          {/* Top Row: Smart Tools */}
          <div className="grid grid-cols-2 gap-6">
            <LiveEvidenceCamera onImageCaptured={handleImageCaptured} />
            <LiveLocationMap
              onLocationFound={handleLocationFound}
              triggerRefresh={refreshLocation}
            />
          </div>

          {/* Bottom Row: Main Form */}
          <div className="card">
            <h3 style={{ marginBottom: "1.5rem" }}>📝 Violation Details</h3>

            <form className="form" onSubmit={handleSubmit}>
              {/* Vehicle Number */}
              <div className="input-group">
                <label htmlFor="vehicleNumber">Vehicle Number *</label>
                <input
                  id="vehicleNumber"
                  type="text"
                  className="input"
                  placeholder="e.g., MH12AB1234"
                  value={violation.vehicleNumber}
                  onChange={(e) => setViolation({ ...violation, vehicleNumber: e.target.value.toUpperCase() })}
                  style={{ textTransform: "uppercase", fontFamily: "monospace", fontSize: "1.1rem" }}
                  disabled={loading}
                />
              </div>

              {/* Quick Select Violation Types */}
              <div>
                <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.875rem", fontWeight: "500", color: "var(--neutral-300)" }}>
                  Quick Select Violation Type
                </label>
                <div className="violation-quick-select" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
                  {violationTypes.map((type) => {
                    const isSelected = type.type === "Other"
                      ? otherSelected
                      : violation.violationType.includes(type.type);

                    return (
                      <button
                        key={type.type}
                        type="button"
                        className={`btn ${isSelected ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                        onClick={() => handleQuickSelect(type)}
                        style={{ flexDirection: "column", height: "auto", padding: "0.75rem 0.5rem" }}
                      >
                        <span style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{type.icon}</span>
                        <span style={{ fontSize: "0.7rem", textAlign: "center", lineHeight: "1.2" }}>{type.type}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="form-row">
                {/* Violation Type Input */}
                <div className="input-group">
                  <label htmlFor="violationType">Violation Type *</label>
                  <input
                    id="violationType"
                    type="text"
                    className="input"
                    placeholder="Select from above"
                    value={violation.violationType}
                    onChange={(e) => setViolation({ ...violation, violationType: e.target.value })}
                    disabled={loading}
                  />
                </div>

                {/* Fine Amount */}
                <div className="input-group">
                  <label htmlFor="fineAmount">Fine Amount (₹) *</label>
                  <input
                    id="fineAmount"
                    type="number"
                    className="input"
                    placeholder="0"
                    value={violation.fineAmount}
                    onChange={(e) => setViolation({ ...violation, fineAmount: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Location */}
              {/* Location */}
              <div className="input-group">
                <label htmlFor="location">Location (Auto-Detected) 📍</label>
                <input
                  id="location"
                  type="text"
                  className="input"
                  placeholder="Waiting for Live GPS..."
                  value={violation.location}
                  readOnly
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", cursor: "default", color: "var(--accent-emerald)" }}
                />
              </div>

              {/* Description */}
              <div className="input-group">
                <label htmlFor="description">Additional Notes (Optional)</label>
                <textarea
                  id="description"
                  className="input"
                  placeholder="Any additional details..."
                  value={violation.description}
                  onChange={(e) => setViolation({ ...violation, description: e.target.value })}
                  disabled={loading}
                  style={{ minHeight: "80px", resize: "vertical" }}
                />
              </div>

              {/* Submit Button */}
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner" style={{ width: "20px", height: "20px", borderWidth: "2px" }}></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      🚨 Issue Challan
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-lg"
                  onClick={() => setViolation({ vehicleNumber: "", violationType: "", fineAmount: "", location: "", description: "" })}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Sidebar - Recent Entries & Stats */}
        <div className="flex flex-col gap-6">
          {/* Today's Stats */}
          <div className="card">
            <h4 style={{ marginBottom: "1rem" }}>📊 Today's Stats</h4>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-muted">Challans Issued</span>
                <span className="font-bold" style={{ color: "var(--primary-400)" }}>{recentEntries.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Total Collection</span>
                <span className="font-bold" style={{ color: "var(--accent-emerald)" }}>
                  ₹{recentEntries.reduce((sum, e) => sum + Number(e.fineAmount), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Avg. Fine</span>
                <span className="font-bold" style={{ color: "var(--accent-amber)" }}>
                  ₹{Math.round(recentEntries.reduce((sum, e) => sum + Number(e.fineAmount), 0) / recentEntries.length || 0)}
                </span>
              </div>

              {/* Pie Chart */}
              <div style={{ height: "200px", marginTop: "1rem" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.values(recentEntries.reduce((acc, curr) => {
                        acc[curr.violationType] = acc[curr.violationType] || { name: curr.violationType, value: 0 };
                        acc[curr.violationType].value += 1;
                        return acc;
                      }, {}))}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.values(recentEntries.reduce((acc, curr) => {
                        acc[curr.violationType] = acc[curr.violationType] || { name: curr.violationType, value: 0 };
                        acc[curr.violationType].value += 1;
                        return acc;
                      }, {})).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Entries */}
          <div className="card" style={{ flex: 1 }}>
            <h4 style={{ marginBottom: "1rem" }}>🕐 Recent Entries</h4>
            {recentEntries.length === 0 ? (
              <div className="empty-state" style={{ padding: "2rem 1rem" }}>
                <div className="empty-state-icon" style={{ fontSize: "2rem" }}>📭</div>
                <div className="empty-state-title" style={{ fontSize: "1rem" }}>No entries yet</div>
                <div className="empty-state-text" style={{ fontSize: "0.875rem" }}>
                  Your recent challans will appear here
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="card-glass"
                    style={{ padding: "0.75rem" }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span style={{ fontFamily: "monospace", fontWeight: "600", color: "var(--neutral-100)" }}>
                        {entry.vehicleNumber}
                      </span>
                      <span className="text-sm text-muted">{entry.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">{entry.violationType}</span>
                      <span className="badge badge-warning">₹{entry.fineAmount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastContainer />
    </div >
  );
}

export default PoliceDashboard;
