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
		method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
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

	async getTicket(data: { username: string; password: string }) {
		return await this.request<{ newUser: boolean; username: string }>('/users/ticket', 'POST', data)
	}

	async login(data: { username: string; password: string }) {
		return await this.request<User>('/users/login', 'POST', data)
	}

	async getUserInfo() {
		return await this.request<User>('/users/me', 'GET')
	}

	async getAvatarImg() {
		return await this.request<{ url: string }>('/emoji/avatar', 'GET')
	}
	async getLockImg() {
		return await this.request<{ url: string }>('/emoji/lock', 'GET')
	}
	async getTicketImg() {
		return await this.request<{ url: string }>('/emoji/ticket', 'GET')
	}

	async getSearchImg() {
		return await this.request<{ url: string }>('/emoji/search', 'GET')
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

	async amIRoomOwner(roomUUID: string) {
		return await this.request<number>(`/room/amiowner?roomUUID=${roomUUID}`, 'GET')
	}
	async roomInfo(roomUUID: string) {
		return await this.request<number>(`/room/info?roomUUID=${roomUUID}`, 'GET')
	}
	// === Методы для сеансов ===

	async openSeance(data: { roomUUID: string; movieID: number }) {
		return await this.request('/seances/open', 'POST', {
			room: { id: data.roomUUID },
			movie: { id: data.movieID },
		})
	}

	async continueSeance() {
		return await this.request('/seances/continue', 'PATCH')
	}
	async handshakeSeance(data: { roomUUID: string }) {
		return await this.request<{ status: boolean }>(`/seances/handshake/${data.roomUUID}`, 'GET')
	}

	async closeSeance() {
		return await this.request(`/seances/close`, 'DELETE')
	}
}

// === Экспорт клиента ===
export const apiClient = new ApiClient('https://watchtogether.fun/api')
