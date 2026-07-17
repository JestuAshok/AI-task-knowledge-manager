import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 30000,
});

// Request interceptor to automatically attach authorization tokens
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session timeouts and server errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear credentials and force reload if unauthorized
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Prevent infinite redirect loops on login pages
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
