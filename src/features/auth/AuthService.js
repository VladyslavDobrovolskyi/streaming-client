import api from '../../services/api';
import axios from 'axios';

export const registerUser = async (userData) => {
    try {
        const response = await api.post('/users/register', userData, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: false,
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Registration failed');
    }
};

export const authLoginUser = async (credentials) => {
    try {
        const response = await api.post('/users/login', credentials, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const { id, email, accessToken } = response.data;
        if (!accessToken) {
            throw new Error('No access token returned from server');
        }
        return { id, email, accessToken };
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Login failed');
    }
};

export const refreshAccessToken = async () => {
    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL_TEST}/auth/refresh`,
            null,
            {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data.accessToken;
    } catch (error) {
        throw new Error('Failed to refresh access token');
    }
};