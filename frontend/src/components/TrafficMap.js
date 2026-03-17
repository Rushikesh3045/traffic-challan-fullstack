
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Helper to generate deterministic coordinates based on vehicle number
// Central point: [28.6139, 77.2090] (New Delhi used as generic center)
const generateCoords = (vehicleNo, index) => {
  // Simple hash function for vehicle number
  let hash = 0;
  for (let i = 0; i < vehicleNo.length; i++) {
    hash = vehicleNo.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Create offsets (range approx +/- 0.05 degrees ~ 5km)
  const latOffset = (hash % 1000) / 10000;
  const lngOffset = ((hash * 13) % 1000) / 10000;

  // Add some randomness based on index to avoid total overlap for same vehicle
  const indexOffset = (index % 10) * 0.001;

  return [28.6139 + latOffset + indexOffset, 77.2090 + lngOffset + indexOffset];
};

const TrafficMap = ({ violations }) => {
  const center = [19.0760, 72.8777]; // Default center (Mumbai/Maharashtra region)

  return (
    <div className="card" style={{ height: '450px', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(15, 23, 42, 0.95)',
        zIndex: 500,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📡 Live Traffic Monitoring
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge badge-success">● Live</span>
          <span className="badge badge-primary">{violations.length} Active</span>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={10}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MarkerClusterGroup chunkedLoading>
            {violations.map((violation, index) => {
              let position;
              // Check for valid GPS coordinates
              const lat = parseFloat(violation.gpsLatitude);
              const lng = parseFloat(violation.gpsLongitude);

              if (!isNaN(lat) && !isNaN(lng)) {
                position = [lat, lng];
              } else {
                // Fallback deterministic location
                position = generateCoords(violation.vehicleNumber || "UNKNOWN", index);
              }

              return (
                <Marker
                  key={violation.id || index}
                  position={position}
                >
                  <Popup>
                    <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{violation.vehicleNumber}</h4>
                      <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold', color: '#dc2626' }}>{violation.violationType}</p>
                      <p style={{ margin: '0', fontSize: '0.9rem' }}>Fine: ₹{violation.fineAmount}</p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                        {violation.location || 'Unknown Location'}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
};

export default TrafficMap;
