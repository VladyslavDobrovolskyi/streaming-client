'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/ApiClient.ts'
import socket from '../socket/index.ts'
import type { Movie } from '../api/ApiClient.ts'
import { v4 } from 'uuid'
import ACTIONS from '../socket/actions.ts'
import './mainv2.css'

const MainV2: React.FC = () => {
	const navigate = useNavigate()
	const [step, setStep] = useState<'welcome' | 'auth' | 'room' | 'movie'>('welcome')
	const [movies, setMovies] = useState<Movie[]>([])
	const [rooms, setRooms] = useState<string[]>([])
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null)
	const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
	const [authData, setAuthData] = useState({
		username: '',
		password: '',
	})
	const [authError, setAuthError] = useState('')

	// Проверка аутентификации
	const checkAuth = async () => {
		try {
			// В реальном приложении здесь должен быть запрос к /auth/check или аналогичному эндпоинту
			// Для демонстрации просто проверяем наличие кук (в реальном приложении нужен запрос к серверу)
			const hasAuthCookie = document.cookie.includes('session-id')
			setIsAuthenticated(hasAuthCookie)

			if (hasAuthCookie && localStorage.getItem('seenWelcomePage')) {
				setStep('room')
			}
		} catch (error) {
			console.error('Auth check error:', error)
		}
	}

	// Загрузка фильмов
	const fetchMovies = async () => {
		try {
			const movies = await apiClient.getMovies()
			setMovies(movies)
		} catch (error) {
			console.error('Error fetching movies:', error)
		}
	}

	useEffect(() => {
		fetchMovies()
		checkAuth()
	}, [])

	// Управление комнатами
	useEffect(() => {
		const handleShareRooms = ({ rooms = [] }: { rooms: string[] }) => {
			setRooms(rooms)
		}

		socket.on(ACTIONS.SHARE_ROOMS, handleShareRooms)
		return () => {
			socket.off(ACTIONS.SHARE_ROOMS, handleShareRooms)
		}
	}, [])

	const handleAuthSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setAuthError('')

		try {
			if (authMode === 'login') {
				await apiClient.login(authData)
			} else {
				await apiClient.register(authData)
			}

			// После успешной аутентификации проверяем статус
			await checkAuth()
			setStep('room')
		} catch (error) {
			console.error('Authentication error:', error)
			setAuthError(error instanceof Error ? error.message : 'Authentication failed')
		}
	}

	const handleLogout = async () => {
		try {
			// В реальном приложении здесь должен быть запрос к /auth/logout
			// Для демонстрации просто очищаем куки
			document.cookie = 'session-id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
			setIsAuthenticated(false)
			setStep('welcome')
		} catch (error) {
			console.error('Logout error:', error)
		}
	}

	const handleSelectMovie = (movieId: number) => {
		setSelectedMovieId(movieId)
		createRoom()
	}

	const createRoom = () => {
		const roomId = v4()
		const pass = prompt('Enter a password for the room (optional):')

		apiClient.createRoom({
			id: roomId,
			movie: { id: Number(selectedMovieId) },
			password: pass || undefined,
		})
		navigate(`/room/${roomId}`)
	}

	const joinRoom = (roomId: string) => {
		navigate(`/room/${roomId}`)
	}

	if (!isAuthenticated && step !== 'welcome' && step !== 'auth') return null

	return (
		<div className='main-container'>
			{step === 'welcome' && (
				<div className='welcome-card'>
					<h1 className='welcome-title'>Welcome to SyncWatch</h1>
					<div className='welcome-content'>
						<div className='icon-container'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								className='welcome-icon'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={1.5}
									d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
								/>
							</svg>
						</div>
						<p className='welcome-text'>
							This app allows you to watch videos together with friends, synchronized in real-time.
						</p>
						<p className='welcome-subtext'>
							Create a room or join an existing one to start watching together. Everyone in the room will
							see the same content at the same time.
						</p>
					</div>
					<button
						onClick={() => {
							localStorage.setItem('seenWelcomePage', 'true')
							setStep('auth')
						}}
						className='primary-button'
					>
						I Get It
					</button>
				</div>
			)}

			{step === 'auth' && (
				<div className='card'>
					<h2 className='card-title'>{authMode === 'login' ? 'Login' : 'Register'}</h2>
					{authError && <div className='error-message'>{authError}</div>}
					<form onSubmit={handleAuthSubmit}>
						<div className='form-group'>
							<input
								type='text'
								value={authData.username}
								onChange={e => setAuthData({ ...authData, username: e.target.value })}
								placeholder='Username'
								className='text-input'
								required
							/>
						</div>
						<div className='form-group'>
							<input
								type='password'
								value={authData.password}
								onChange={e => setAuthData({ ...authData, password: e.target.value })}
								placeholder='Password'
								className='text-input'
								required
							/>
						</div>
						<button type='submit' className='primary-button'>
							{authMode === 'login' ? 'Login' : 'Register'}
						</button>
						<button
							type='button'
							className='secondary-button'
							onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
						>
							{authMode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
						</button>
					</form>
				</div>
			)}

			{step === 'room' && (
				<div className='card'>
					<div className='auth-status'>
						<span>Logged in as: {authData.username}</span>
						<button onClick={handleLogout} className='logout-button'>
							Logout
						</button>
					</div>

					<h2 className='card-title'>Join or Create a Room</h2>

					<div className='create-room-container'>
						<button onClick={() => setStep('movie')} className='primary-button create-button'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								className='button-icon'
								viewBox='0 0 20 20'
								fill='currentColor'
							>
								<path
									fillRule='evenodd'
									d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z'
									clipRule='evenodd'
								/>
							</svg>
							Create a New Room
						</button>
					</div>

					<div className='rooms-container'>
						<h3 className='rooms-title'>Available Rooms</h3>
						{rooms.length > 0 ? (
							<div className='rooms-list'>
								{rooms.map(roomID => (
									<div key={roomID} className='room-item'>
										<span className='room-id'>{roomID}</span>
										<button onClick={() => joinRoom(roomID)} className='join-button'>
											Join
										</button>
									</div>
								))}
							</div>
						) : (
							<div className='no-rooms'>No rooms available</div>
						)}
					</div>
				</div>
			)}

			{step === 'movie' && (
				<div className='card movie-selection-card'>
					<h2 className='card-title'>Select a Movie for Your Room</h2>
					<div className='movie-grid'>
						{movies.map(movie => (
							<div
								key={movie.id}
								className={`movie-poster-container ${
									Number(selectedMovieId) === movie.id ? 'selected' : ''
								}`}
								onClick={() => handleSelectMovie(movie.id)}
								role='button'
								tabIndex={0}
								onKeyPress={e => {
									if (e.key === 'Enter') handleSelectMovie(movie.id)
								}}
							>
								<img
									src={movie.poster || '/placeholder.svg'}
									alt={movie.title}
									className='movie-poster'
								/>
								<div className='movie-title'>{movie.title}</div>
								{selectedMovieId === movie.id && (
									<div className='selected-indicator'>
										<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'>
											<path
												fillRule='evenodd'
												d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
												clipRule='evenodd'
											/>
										</svg>
									</div>
								)}
							</div>
						))}
					</div>
					<button onClick={() => setStep('room')} className='secondary-button back-button'>
						Back to Room Selection
					</button>
				</div>
			)}
		</div>
	)
}

export default MainV2
