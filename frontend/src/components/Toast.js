import { useState, useEffect, useCallback } from "react";

function Toast({ message, type = "success", onClose, duration = 4000 }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        <div className={`toast toast-${type}`}>
            <span>
                {type === "success" && "✅"}
                {type === "error" && "❌"}
                {type === "warning" && "⚠️"}
                {type === "info" && "ℹ️"}
            </span>
            <span>{message}</span>
            <button
                onClick={onClose}
                style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--neutral-400)",
                    cursor: "pointer",
                    marginLeft: "0.5rem"
                }}
            >
                ✕
            </button>
        </div>
    );
}

// Custom hook for toast notifications
export function useToast() {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const ToastContainer = () => (
        <>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </>
    );

    return { showToast, ToastContainer };
}

export default Toast;
