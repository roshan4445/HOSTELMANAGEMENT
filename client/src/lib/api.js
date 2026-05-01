import axios from 'axios';

/**
 * Centralized Axios instance.
 * - Base URL from environment variable (falls back to localhost for dev)
 * - Auto-attaches JWT token from localStorage to every request
 * - Single place to change API URL for deployment
 */
const API = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL || 'https://hostelmanagement-rss4.onrender.com',
});

// Request interceptor: auto-attach auth token
API.interceptors.request.use((config) => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo?.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
  } catch (e) {
    // If localStorage is corrupted, proceed without token
  }
  return config;
});

export default API;
