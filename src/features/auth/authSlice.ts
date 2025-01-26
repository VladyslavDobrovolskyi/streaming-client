import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authLoginUser, registerUser, refreshAccessToken } from './AuthService'

// Типы для состояния и данных
interface AuthState {
	accessToken: string | null
	refreshToken: string | null
	profileData: { id: string; email: string } | null
	isLoading: boolean
	error: string | null
	isAuthenticated: boolean
}

interface LoginPayload {
	id: string
	email: string
	accessToken: string
	refreshToken: string
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

// Асинхронные экшены
export const register = createAsyncThunk(
	'auth/register',
	async (userData: { email: string; password: string }, { rejectWithValue }) => {
		try {
			const { id, email, token } = await registerUser(userData)
			return { id, email, token }
		} catch (error) {
			if (error instanceof Error) {
				return rejectWithValue(error.message)
			}
			return rejectWithValue('An unknown error occurred')
		}
	}
)

export const login = createAsyncThunk(
	'auth/login',
	async (credentials: { email: string; password: string }, { rejectWithValue }) => {
		try {
			const { id, email, accessToken, refreshToken } = await authLoginUser(credentials)
			return { id, email, accessToken, refreshToken }
		} catch (error) {
			if (error instanceof Error) {
				return rejectWithValue(error.message)
			}
			return rejectWithValue('An unknown error occurred')
		}
	}
)

export const refreshToken = createAsyncThunk('auth/refreshToken', async (_, { rejectWithValue }) => {
	try {
		const accessToken = await refreshAccessToken()
		return accessToken
	} catch (error: unknown) {
		if (error instanceof Error) {
			return rejectWithValue(error.message)
		}
	}
})

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		clearAuthState: state => {
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
			.addCase(login.pending, state => {
				state.isLoading = true
			})
			.addCase(login.fulfilled, (state, action: PayloadAction<LoginPayload>) => {
				state.isLoading = false
				state.accessToken = action.payload.accessToken
				state.refreshToken = action.payload.refreshToken
				state.profileData = { id: action.payload.id, email: action.payload.email }
				localStorage.setItem('accessToken', action.payload.accessToken)
				localStorage.setItem('refreshToken', action.payload.refreshToken)
				state.isAuthenticated = true
			})
			.addCase(login.rejected, (state, action) => {
				state.isLoading = false
				state.error = action.payload as string
			})
			.addCase(refreshToken.fulfilled, (state, action: PayloadAction<string>) => {
				state.accessToken = action.payload
				localStorage.setItem('accessToken', action.payload)
			})
			.addCase(refreshToken.rejected, state => {
				state.isAuthenticated = false
				state.accessToken = null
				state.refreshToken = null
				localStorage.removeItem('accessToken')
				localStorage.removeItem('refreshToken')
			})
	},
})

export const { clearAuthState } = authSlice.actions
export default authSlice.reducer
