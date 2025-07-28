import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api/',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export default axiosInstance;
