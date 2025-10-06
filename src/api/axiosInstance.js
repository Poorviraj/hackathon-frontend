import axios from 'axios';

// Get the Base URL from the environment variables (Vite convention: VITE_ prefix)
// In production on Render, you must set this environment variable for the frontend service!
const baseURL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:4000/api/v1';

const axiosInstance = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to attach the JWT token to every request (except login/signup)
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
