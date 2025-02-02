import api from '../../services/api'
import axios from 'axios'

// Типы ответов API
interface RegistrationResponse {
    id: string
    username: string
    accessToken: string
    refreshToken: string
}

interface ProfileUpdateData {
    username?: string
    password?: string
}

interface ProfileResponse {
    id: string
    username: string
}

// 🔹 Регистрация пользователя
export const registerUser = async (userData: { username: string; password: string }): Promise<RegistrationResponse> => {
    try {
        const response = await api.post('/users/register', userData, {
            headers: { 'Content-Type': 'application/json' },
        })
        return response.data
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Registration failed')
        }
        throw new Error('Registration failed')
    }
}

// 🔹 Обновление профиля
export const updateProfile = async (updateData: ProfileUpdateData, token: string): Promise<ProfileResponse> => {
    try {
        const response = await api.put('/users/update', updateData, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        })
        return response.data
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Profile update failed')
        }
        throw new Error('Profile update failed')
    }
}

// 🔹 Удаление аккаунта
export const deleteAccount = async (token: string): Promise<void> => {
    try {
        await api.delete('/api/users/delete', {
            headers: { Authorization: `Bearer ${token}` },
        })
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Account deletion failed')
        }
        throw new Error('Account deletion failed')
    }
}
