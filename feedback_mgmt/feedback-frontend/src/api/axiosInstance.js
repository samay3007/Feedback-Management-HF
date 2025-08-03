import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api/',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach access token
axiosInstance.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('authTokens');
    const access = tokens ? JSON.parse(tokens).access : null;

    if (access) {
      config.headers.Authorization = `Bearer ${access}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: refresh token on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite retry loop
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const tokens = localStorage.getItem('authTokens');
        const refresh = tokens ? JSON.parse(tokens).refresh : null;

        if (!refresh) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          'http://localhost:8080/api/auth/token/refresh/',
          { refresh }
        );

        const newTokens = {
          access: response.data.access,
          refresh: refresh,
        };

        // Store new access token
        localStorage.setItem('authTokens', JSON.stringify(newTokens));

        // Update header and retry original request
        axiosInstance.defaults.headers.Authorization = `Bearer ${newTokens.access}`;
        originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed — force logout
        localStorage.removeItem('authTokens');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
