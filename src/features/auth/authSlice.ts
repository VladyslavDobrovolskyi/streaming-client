import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authLoginUser, refreshAccessToken } from './AuthService'

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

export const login = createAsyncThunk(
	'auth/login',
	async (credentials: { email: string; password: string }, { rejectWithValue }) => {
		try {
			const { id, email, accessToken, refreshToken } = await authLoginUser(credentials)
			console.log('Login successful:', { id, email, accessToken, refreshToken })
			return { id, email, accessToken, refreshToken }
		} catch (error) {
			console.error('Login failed:', error)
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
		console.log('Refresh token successful:', accessToken)
		return accessToken
	} catch (error: unknown) {
		console.error('Refresh token failed:', error)
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
			console.log('Clearing auth state')
			state.accessToken = null
			state.refreshToken = null
			state.profileData = null
			state.isAuthenticated = false
			localStorage.removeItem('accessToken')
			localStorage.removeItem('profileData')
		},
	},
	extraReducers: builder => {
		builder
			.addCase(login.pending, state => {
				console.log('Login pending')
				state.isLoading = true
			})
			.addCase(login.fulfilled, (state, action: PayloadAction<LoginPayload>) => {
				console.log('Login fulfilled:', action.payload)
				state.isLoading = false
				state.accessToken = action.payload.accessToken
				state.refreshToken = action.payload.refreshToken
				state.profileData = { id: action.payload.id, email: action.payload.email }
				localStorage.setItem('accessToken', action.payload.accessToken)
				state.isAuthenticated = true
			})
			.addCase(login.rejected, (state, action) => {
				console.error('Login rejected:', action.payload)
				state.isLoading = false
				state.error = action.payload as string
			})
			.addCase(refreshToken.fulfilled, (state, action: PayloadAction<string | undefined>) => {
				console.log('Refresh token fulfilled:', action.payload)
				if (action.payload) {
					state.accessToken = action.payload
					localStorage.setItem('accessToken', action.payload)
				} else {
					state.isAuthenticated = false
					state.accessToken = null
					state.refreshToken = null
					localStorage.removeItem('accessToken')
				}
			})
			.addCase(refreshToken.rejected, state => {
				console.error('Refresh token rejected')
				state.isAuthenticated = false
				state.accessToken = null
				state.refreshToken = null
				localStorage.removeItem('accessToken')
			})
	},
})

export const { clearAuthState } = authSlice.actions
export default authSlice.reducer
