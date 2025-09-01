// phycare/frontend/src/api/axios.js

import axios from 'axios';

// Create the Axios instance
const api = axios.create({
  // Using an environment variable makes the code more flexible for deployment.
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// This interceptor automatically adds the authentication token to every request.
// This is the correct way to handle authentication and fixes the 401 error.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config; // Continue with the request
  },
  (error) => {
    // Handle any request errors
    return Promise.reject(error);
  }
);

export default api;