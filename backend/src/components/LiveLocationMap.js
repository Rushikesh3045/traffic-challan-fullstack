
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Inner component: imperatively recenters the map whenever position changes
// MapContainer's 'center' prop is only used on first render and is NOT reactive.
// useMap() gives us direct access to the Leaflet map instance to call setView().
const MapRecenter = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.setView(position, map.getZoom());
        }
    }, [position, map]);
    return null;
};

const LiveLocationMap = ({ onLocationFound, triggerRefresh }) => {
    const [position, setPosition] = useState(null);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const watchIdRef = useRef(null);

    useEffect(() => {
        // Clear any existing watch before starting a new one
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        setError(null);

        const startTracking = () => {
            if (!navigator.geolocation) {
                setError('Geolocation is not supported by this browser.');
                return;
            }

            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    console.log('Live GPS Update:', latitude, longitude);
                    setPosition([latitude, longitude]);
                    setError(null);

                    if (onLocationFound) {
                        onLocationFound(latitude, longitude);
                    }
                },
                (err) => {
                    console.error('GPS Watch Error:', err);

                    let msg = 'Unable to get your location.';
                    if (err.code === err.PERMISSION_DENIED) {
                        msg = 'Location permission denied. Please allow location access in your browser settings and click Retry.';
                    } else if (err.code === err.POSITION_UNAVAILABLE) {
                        msg = 'Location signal unavailable. Please check your GPS / network and click Retry.';
                    } else if (err.code === err.TIMEOUT) {
                        msg = 'Location request timed out. Click Retry to try again.';
                    }

                    // Only set error if we don't already have a valid GPS fix
                    if (!position) {
                        setError(msg);
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0        // Always request a fresh location — never use cached
                }
            );
        };

        startTracking();

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [triggerRefresh, retryCount]);

    // Custom "Officer" Icon
    const officerIcon = new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/2643/2643336.png',
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38]
    });

    // ── Error / waiting state ──────────────────────────────────────────────────
    if (!position) {
        return (
            <div style={{
                height: '220px',
                borderRadius: '0.75rem',
                border: '2px solid #ef4444',
                background: 'rgba(239,68,68,0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '1rem',
                textAlign: 'center'
            }}>
                {error ? (
                    <>
                        <span style={{ fontSize: '2rem' }}>📍</span>
                        <p style={{ color: '#fca5a5', fontSize: '0.8rem', maxWidth: '260px', margin: 0 }}>
                            {error}
                        </p>
                        <button
                            onClick={() => {
                                setError(null);
                                setRetryCount(prev => prev + 1);
                            }}
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '0.5rem',
                                padding: '0.4rem 1rem',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                            }}
                        >
                            🔄 Retry
                        </button>
                    </>
                ) : (
                    <>
                        <span style={{ fontSize: '2rem', animation: 'pulse 1.5s infinite' }}>🛰️</span>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                            Acquiring live GPS location…
                        </p>
                    </>
                )}
            </div>
        );
    }

    // ── Live map ───────────────────────────────────────────────────────────────
    return (
        <div className="map-container" style={{
            height: '220px',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            border: '2px solid #3b82f6',
            position: 'relative',
            marginTop: '0'
        }}>
            {/* Live badge */}
            <div style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                zIndex: 1000,
                fontSize: '0.7rem',
                fontWeight: 'bold'
            }}>
                🟢 Live
            </div>

            <MapContainer
                center={position}
                zoom={15}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapRecenter position={position} />
                <Marker position={position} icon={officerIcon}>
                    <Popup>
                        <strong>Officer On Duty</strong><br />
                        Live GPS location.
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default LiveLocationMap;
