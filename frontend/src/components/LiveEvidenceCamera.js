
import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

const LiveEvidenceCamera = ({ onImageCaptured }) => {
    const webcamRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);
    const [isEnabled, setIsEnabled] = useState(false);

    // Toggle Camera On/Off
    const toggleCamera = () => {
        setIsEnabled(!isEnabled);
        setImgSrc(null); // Clear previous image when toggling
    };

    // Capture Screenshot
    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImgSrc(imageSrc);
            if (onImageCaptured) {
                onImageCaptured(imageSrc);
            }
        }
    }, [webcamRef, onImageCaptured]);

    // Retake Photo
    const retake = () => {
        setImgSrc(null);
    };

    return (
        <div className="camera-container" style={{
            background: '#1e293b',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '1rem' }}>📸 Live Evidence</h3>

            {!isEnabled ? (
                <div style={{
                    height: '180px',
                    background: '#0f172a',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    border: '2px dashed #334155'
                }}>
                    <span style={{ fontSize: '2rem' }}>📷</span>
                    <button
                        onClick={toggleCamera}
                        className="btn"
                        style={{
                            background: '#3b82f6',
                            color: 'white',
                            padding: '0.4rem 1rem',
                            borderRadius: '0.4rem',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                        }}
                    >
                        Start Camera
                    </button>
                </div>
            ) : (
                <>
                    <div style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', border: '2px solid #3b82f6' }}>
                        {imgSrc ? (
                            <img src={imgSrc} alt="Captured evidence" style={{ width: '100%', borderRadius: '0.5rem' }} />
                        ) : (
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                width="100%"
                                videoConstraints={{ facingMode: "environment" }} // Use back camera on mobile
                            />
                        )}
                    </div>

                    <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        {imgSrc ? (
                            <>
                                <button
                                    onClick={retake}
                                    className="btn"
                                    style={{ background: '#64748b', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    Retake
                                </button>
                                <div style={{ padding: '0.4rem 0.8rem', background: '#10b981', color: 'white', borderRadius: '0.4rem', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                    ✅ Captured
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={capture}
                                className="btn"
                                style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    padding: '0.4rem 1.5rem',
                                    borderRadius: '1.5rem',
                                    fontWeight: 'bold',
                                    border: '3px solid rgba(239, 68, 68, 0.3)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                CAPTURE
                            </button>
                        )}
                        <button
                            onClick={toggleCamera}
                            className="btn-ghost"
                            style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', marginLeft: 'auto', fontSize: '0.8rem' }}
                        >
                            Close
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default LiveEvidenceCamera;
