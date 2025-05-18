// src/api/ApiClient.ts

// === Типы данных ===
export interface User {
	id: string
	username: string
}

export interface Movie {
	id: number
	title: string
	poster: string
	resource: string
}

export interface Room {
	id?: string
	name: string
	password?: string
	owner?: User
}

export interface JoinRoomRequest {
	roomUUID: string
	password?: string
}

// === Клиент API ===
export class ApiClient {
	private baseUrl: string

	constructor(baseUrl: string = '/api') {
		this.baseUrl = baseUrl
	}

	/**
	 * Базовый метод запроса
	 */
	private async request<T>(
		endpoint: string,
		method: 'GET' | 'POST' | 'PUT' | 'DELETE',
		body?: unknown,
		options: RequestInit = {}
	): Promise<T> {
		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method,
			headers: {
				'Content-Type': 'application/json',
				...(options.headers || {}),
			},
			body: body ? JSON.stringify(body) : undefined,
			credentials: 'include', // передача куки
			...options,
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(`Error ${response.status}: ${errorText}`)
		}

		return await response.json()
	}

	// === Методы для пользователей ===

	async register(data: { username: string; password: string }) {
		return await this.request<User>('/users/register', 'POST', data)
	}

	async login(data: { username: string; password: string }) {
		return await this.request<User>('/users/login', 'POST', data)
	}

	async getUserInfo() {
		return await this.request<User>('/users/me', 'GET')
	}

	async getAvatar() {
		return await this.request<{ url: string }>('/get/emoji', 'GET')
	}
	// === Методы для фильмов ===
	async getMovies() {
		return await this.request<Movie[]>(`/movies/all`, 'GET')
	}
	async getMovieInfo(id: number) {
		return await this.request<Movie>(`/movies/${id}`, 'GET')
	}

	// === Методы для комнат ===

	async createRoom(data: { id: string; movie: { id: number }; password?: string }) {
		return await this.request<Room>('/room/create', 'POST', data)
	}

	async joinRoom(data: JoinRoomRequest) {
		return await this.request<string>('/room/join', 'POST', data)
	}

	async roomInfo(roomUUID: string) {
		return await this.request<Room>(`/room/info?roomUUID=${roomUUID}`, 'GET')
	}
	// === Методы для сеансов ===

	async openSeance(data: { roomUUID: string; movieID: number }) {
		return await this.request('/seances/open', 'POST', {
			room: { id: data.roomUUID },
			movie: { id: data.movieID },
		})
	}

	async closeSeance() {
		return await this.request(`/seances/close`, 'DELETE')
	}
}

// === Экспорт клиента ===
export const apiClient = new ApiClient('https://watchtogether.fun/api')
