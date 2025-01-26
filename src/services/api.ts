import axios from 'axios'
import { refreshToken, clearAuthState } from '../features/auth/authSlice'

const api = axios.create({
	baseURL: 'https://streaming.vladyslavdobrovolskyi.tech/api/',
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true,
})

api.interceptors.request.use(
	async config => {
		const { default: store } = await import('../redux/store')
		const state = store.getState()
		const token = state.auth.accessToken
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
				const { default: store } = await import('../redux/store')
				const newAccessToken = await store.dispatch(refreshToken()).unwrap()
				originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
				return api(originalRequest)
			} catch (refreshError) {
				const { default: store } = await import('../redux/store')
				store.dispatch(clearAuthState())
				return Promise.reject(refreshError)
			}
		}
		return Promise.reject(error)
	}
)

export default api
