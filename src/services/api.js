import axios from 'axios';
import store from '../redux/store';
import { refreshToken, logoutAsync } from '../features/auth/authSlice';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL_TEST,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        const state = store.getState();
        const token = state.auth.accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
              const newAccessToken = await store.dispatch(refreshToken()).unwrap();
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
              return api(originalRequest);
          } catch (refreshError) {
              store.dispatch(logoutAsync());
              return Promise.reject(refreshError);
          }
      }
      return Promise.reject(error);
  }
);

export default api;
