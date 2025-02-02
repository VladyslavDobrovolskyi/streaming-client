import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { registerUser, updateProfile, deleteAccount } from './UserService'

// Типы состояния
interface AuthState {
    accessToken: string | null
    refreshToken: string | null
    profileData: { id: string; username: string } | null
    isLoading: boolean
    error: string | null
    isAuthenticated: boolean
}

interface AuthPayload {
    id: string
    username: string
    accessToken: string
    refreshToken: string
}

interface ProfileUpdatePayload {
    username: string
}

// Начальное состояние
const initialState: AuthState = {
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    profileData: JSON.parse(localStorage.getItem('profileData') || 'null'),
    isLoading: false,
    error: null,
    isAuthenticated: Boolean(localStorage.getItem('accessToken')),
}

// 🔹 Регистрация пользователя
export const register = createAsyncThunk(
    'users/register',
    async (userData: { username: string; password: string }, { rejectWithValue }) => {
        try {
            const { id, username, accessToken, refreshToken } = await registerUser(userData)
            return { id, username, accessToken, refreshToken }
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred')
        }
    }
)

// 🔹 Обновление профиля пользователя
export const updateUserProfile = createAsyncThunk(
    'users/updateProfile',
    async ({ updateData, token }: { updateData: { username?: string; password?: string }; token: string }, { rejectWithValue }) => {
        try {
            const { username } = await updateProfile(updateData, token)
            return { username }
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Profile update failed')
        }
    }
)

// 🔹 Удаление аккаунта
export const deleteUserAccount = createAsyncThunk(
    'users/deleteAccount',
    async ({ token }: { token: string }, { rejectWithValue }) => {
        try {
            await deleteAccount(token)
            return true
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Account deletion failed')
        }
    }
)

const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        logout: state => {
            state.accessToken = null
            state.refreshToken = null
            state.profileData = null
            state.isAuthenticated = false
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('profileData')
        },
    },
    extraReducers: builder => {
        builder
            // Регистрация
            .addCase(register.pending, state => {
                state.isLoading = true
                state.error = null
            })
            .addCase(register.fulfilled, (state, action: PayloadAction<AuthPayload>) => {
                state.isLoading = false
                state.accessToken = action.payload.accessToken
                state.refreshToken = action.payload.refreshToken
                state.profileData = { id: action.payload.id, username: action.payload.username }
                state.isAuthenticated = true
                localStorage.setItem('accessToken', action.payload.accessToken)
                localStorage.setItem('refreshToken', action.payload.refreshToken)
                localStorage.setItem('profileData', JSON.stringify(state.profileData))
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string
            })

            // Обновление профиля
            .addCase(updateUserProfile.pending, state => {
                state.isLoading = true
                state.error = null
            })
            .addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<ProfileUpdatePayload>) => {
                if (state.profileData) {
                    state.profileData.username = action.payload.username
                    localStorage.setItem('profileData', JSON.stringify(state.profileData))
                }
                state.isLoading = false
            })
            .addCase(updateUserProfile.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string
            })

            // Удаление аккаунта
            .addCase(deleteUserAccount.pending, state => {
                state.isLoading = true
                state.error = null
            })
            .addCase(deleteUserAccount.fulfilled, state => {
                state.isLoading = false
                state.accessToken = null
                state.refreshToken = null
                state.profileData = null
                state.isAuthenticated = false
                localStorage.clear()
            })
            .addCase(deleteUserAccount.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string
            })
    },
})

export const { logout } = userSlice.actions
export default userSlice.reducer
