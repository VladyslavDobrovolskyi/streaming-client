import api from '../../services/api';
import axios from 'axios';

interface RegisterResponse {
  id: string;
  email: string;
  token: string;
}

interface LoginResponse {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export const registerUser = async (userData: { email: string; password: string }): Promise<RegisterResponse> => {
  try {
    const response = await api.post('/users/register', userData, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Registration failed');
    }
    throw new Error('Registration failed');
  }
};

export const authLoginUser = async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
  try {
    const response = await api.post('/users/login', credentials, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Login failed');
    }
    throw new Error('Login failed');
  }
};

export const refreshAccessToken = async (): Promise<string> => {
  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL_TEST}/auth/refresh`, null, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data.accessToken;
  } catch {
    throw new Error('Failed to refresh access token');
  }
};
