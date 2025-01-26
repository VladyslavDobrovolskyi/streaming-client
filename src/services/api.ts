import axios from 'axios'
import store, { RootState } from '../redux/store'
import { refreshToken } from '../features/auth/authSlice'
import { clearAuthState } from '../features/auth/authSlice'

const api = axios.create({
	baseURL: 'https://streaming.vladyslavdobrovolskyi.tech/api/',
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true,
})

api.interceptors.request.use(
	config => {
		const state = store.getState() as RootState
		const token = (state.auth as unknown as { accessToken: string }).accessToken
		if (token) {
			config.headers.Authorization = `Bearer ${token}`
		}
		return config
	},
	error => Promise.reject(error)
)

api.interceptors.response.use(
	response => response,
	async error => {
		const originalRequest = error.config
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true

			try {
				const newAccessToken = await store.dispatch(refreshToken()).unwrap()
				originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
				return api(originalRequest)
			} catch (refreshError) {
				store.dispatch(clearAuthState())
				return Promise.reject(refreshError)
			}
		}
		return Promise.reject(error)
	}
)

export default api
