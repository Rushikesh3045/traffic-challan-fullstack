import axios from "axios";

// १. baseURL मध्ये तुझ्या Render बॅकएंडची URL टाका
const api = axios.create({
  baseURL: "https://traffic-challan-fullstack.onrender.com" 
});

// २. WS_URL मध्ये WebSocket साठी 'https' ऐवजी 'wss' वापरा
export const WS_URL = "wss://traffic-challan-fullstack.onrender.com/traffic-websocket";

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;