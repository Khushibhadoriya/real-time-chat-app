// frontend/src/services/api.js

import axios from 'axios';

// ─────────────────────────────────────────────
// WHAT IS AXIOS?
// Axios is an HTTP client — it makes requests to our backend
//
// WHY not just use fetch()?
// Axios automatically:
//   → converts response to JSON (fetch needs .json() manually)
//   → throws errors for 4xx/5xx (fetch doesn't — you have to check)
//   → lets us set base URL once (no repeating http://localhost:5003)
//   → lets us set headers once (no repeating Authorization header)
// ─────────────────────────────────────────────

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5003/api', // All requests prefix with this
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────────────
// REQUEST INTERCEPTOR
// Runs BEFORE every request is sent
// WHY: Automatically attaches JWT token to every request
// Without this: we'd have to manually add token to every API call
// ─────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('chatsphere_token');

    if (token) {
      // Attach token to Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config; // continue with the request
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// RESPONSE INTERCEPTOR
// Runs AFTER every response is received
// WHY: Handle token expiry globally
// If backend sends 401, token expired → clear storage → redirect to login
// ─────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response, // success — just return response

  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('chatsphere_token');
      localStorage.removeItem('chatsphere_user');
      // Redirect to login page
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;