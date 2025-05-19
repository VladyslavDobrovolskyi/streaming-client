'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/ApiClient.ts'
import socket from '../socket/index.ts'
import type { Movie } from '../api/ApiClient.ts'
import { v4 } from 'uuid'
import ACTIONS from '../socket/actions.ts'

const ticketImg =
	'https://www.gstatic.com/android/keyboard/emojikitchen/20240206/u1f39f-ufe0f/u1f39f-ufe0f_u2699-ufe0f.png'

const MainV2 = () => {
	const navigate = useNavigate()
	const [step, setStep] = useState<'welcome' | 'auth' | 'room' | 'movie'>('welcome')
	const [movies, setMovies] = useState<Movie[]>([])
	const [rooms, setRooms] = useState<string[]>([])
	const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null)
	const [authError, setAuthError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')

	const [isModalOpen, setIsModalOpen] = useState(false)
	const [roomPassword, setRoomPassword] = useState('')
	const [pendingRoomId, setPendingRoomId] = useState<string | null>(null)

	const fetchMovies = async () => {
		try {
			const movies = await apiClient.getMovies()
			setMovies(movies)
		} catch (error) {
			console.error('Error fetching movies:', error)
			if ((error as Error).message.includes('401')) {
				setStep('auth')
			}
		}
	}

	useEffect(() => {
		if (localStorage.getItem('seenWelcomePage')) {
			setStep('auth')
		}
		fetchMovies()
	}, [])

	useEffect(() => {
		const handleShareRooms = ({ rooms = [] }: { rooms: string[] }) => {
			setRooms(rooms)
		}

		socket.on(ACTIONS.SHARE_ROOMS, handleShareRooms)
		return () => {
			socket.off(ACTIONS.SHARE_ROOMS, handleShareRooms)
		}
	}, [])

	// Авторизация с логином и паролем
	const handleLogin = async () => {
		setAuthError('')
		setIsLoading(true)

		try {
			await apiClient.login({ username, password })
			await fetchMovies()
			setStep('room')
		} catch (error) {
			setAuthError(error instanceof Error ? error.message : 'Login failed')
		} finally {
			setIsLoading(false)
		}
	}

	// Отдельная кнопка, которая просто получает билет без username/password
	const handleGetTicket = async () => {
		setAuthError('')
		setIsLoading(true)

		try {
			await apiClient.getTicket({ username, password })
			await fetchMovies()
			setStep('room')
		} catch (error) {
			setAuthError(error instanceof Error ? error.message : 'Failed to get ticket')
		} finally {
			setIsLoading(false)
		}
	}

	const handleSelectMovie = (movieId: number) => {
		setSelectedMovieId(movieId)
		const newRoomId = v4()
		setPendingRoomId(newRoomId)
		setIsModalOpen(true)
	}

	const confirmCreateRoom = async () => {
		if (!selectedMovieId || !pendingRoomId) return

		try {
			await apiClient.createRoom({
				id: pendingRoomId,
				movie: { id: selectedMovieId },
				password: roomPassword || undefined,
			})
			setIsModalOpen(false)
			setRoomPassword('')
			navigate(`/join/${pendingRoomId}`)
		} catch (error) {
			console.error('Room creation failed:', error)
			alert('Failed to create room. Please try again.')
		}
	}

	const joinRoom = (roomId: string) => {
		navigate(`/join/${roomId}`)
	}

	if (isLoading) {
		return (
			<div className='main-container'>
				<div className='spinner' />
				<Styles />
			</div>
		)
	}

	return (
		<div className='main-container'>
			<Styles />
			{step === 'welcome' && (
				<div className='card'>
					<h1 className='title'>Welcome to SyncWatch</h1>
					<button
						onClick={() => {
							localStorage.setItem('seenWelcomePage', 'true')
							setStep('auth')
						}}
						className='button primary'
					>
						I Get It
					</button>
				</div>
			)}

			{step === 'auth' && (
				<div className='card'>
					<h2 className='title'>Login or Get Ticket</h2>
					{authError && <div className='error'>{authError}</div>}

					{/* Форма с логином и паролем */}
					<input
						type='text'
						placeholder='Username'
						value={username}
						onChange={e => setUsername(e.target.value)}
						className='input'
					/>
					<input
						type='password'
						placeholder='Password'
						value={password}
						onChange={e => setPassword(e.target.value)}
						className='input'
					/>

					{/* Кнопка логина */}
					<button
						onClick={handleLogin}
						className='button primary'
						disabled={isLoading || !username || !password}
					>
						Login
					</button>

					{/* Отдельная кнопка "Get the ticket" */}
					<button onClick={handleGetTicket} className='button ticket-button' disabled={isLoading}>
						<img src={ticketImg} alt='Ticket' className='ticket-img' />
						<span>Get the ticket</span>
					</button>
				</div>
			)}

			{step === 'room' && (
				<div className='card'>
					<h2 className='title'>Room Selection</h2>
					<button onClick={() => setStep('movie')} className='button primary'>
						Create New Room
					</button>
					<div className='list'>
						{rooms.map(roomID => (
							<div key={roomID} className='list-item'>
								<span>{roomID}</span>
								<button onClick={() => joinRoom(roomID)} className='button small'>
									Join
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{step === 'movie' && (
				<div className='card'>
					<h2 className='title'>Select Movie</h2>
					<div className='grid'>
						{movies.map(movie => (
							<div key={movie.id} className='poster' onClick={() => handleSelectMovie(movie.id)}>
								<img src={movie.poster} alt={movie.title} />
								<div className='caption'>{movie.title}</div>
							</div>
						))}
					</div>
					<button onClick={() => setStep('room')} className='button secondary'>
						Back
					</button>
				</div>
			)}

			{isModalOpen && (
				<div className='modal-overlay'>
					<div className='modal'>
						<h3>Set Room Password (optional)</h3>
						<input
							type='text'
							value={roomPassword}
							onChange={e => setRoomPassword(e.target.value)}
							placeholder='Enter password...'
							className='input'
						/>
						<div className='modal-actions'>
							<button className='button primary' onClick={confirmCreateRoom}>
								Create Room
							</button>
							<button
								className='button secondary'
								onClick={() => {
									setIsModalOpen(false)
									setRoomPassword('')
									setPendingRoomId(null)
								}}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

const Styles = () => (
	<style>{`
		* {
			box-sizing: border-box;
		}
		body, html, .main-container {
			margin: 0;
			padding: 0;
			font-family: sans-serif;
			background-color: #f5f5f5;
			color: #333;
			min-height: 100vh;
			display: flex;
			justify-content: center;
			align-items: center;
		}
		.card {
			background: #fff;
			padding: 2rem;
			border-radius: 1rem;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);
			width: 100%;
			max-width: 420px;
			text-align: center;
		}
		.title {
			font-size: 1.5rem;
			margin-bottom: 1rem;
		}
		.input {
			width: 100%;
			padding: 0.75rem;
			margin-bottom: 1rem;
			border: 1px solid #ccc;
			border-radius: 0.75rem;
			font-size: 1rem;
		}
		.button {
			cursor: pointer;
			border: none;
			padding: 0.75rem 1.5rem;
			border-radius: 1rem;
			font-weight: 600;
			margin: 0.3rem 0;
			transition: background-color 0.3s ease;
		}
		.button.primary {
			background-color: #4a90e2;
			color: white;
		}
		.button.primary:hover:not(:disabled) {
			background-color: #357ABD;
		}
		.button.secondary {
			background-color: #eee;
			color: #333;
		}
		.button.secondary:hover:not(:disabled) {
			background-color: #ccc;
		}
		.button.small {
			padding: 0.3rem 0.6rem;
			font-size: 0.8rem;
			margin-left: 1rem;
		}
		.error {
			color: #e74c3c;
			margin-bottom: 1rem;
			font-weight: 600;
		}
		.grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
			gap: 1rem;
			margin-bottom: 1rem;
		}
		.poster {
			cursor: pointer;
			border-radius: 0.5rem;
			overflow: hidden;
			box-shadow: 0 0 5px rgba(0,0,0,0.1);
			transition: transform 0.3s ease;
		}
		.poster:hover {
			transform: scale(1.05);
		}
		.poster img {
			width: 100%;
			height: auto;
			display: block;
		}
		.caption {
			padding: 0.5rem;
			font-size: 0.9rem;
			background: #fff;
			text-align: center;
		}
		.list {
			max-height: 200px;
			overflow-y: auto;
			margin-top: 1rem;
			text-align: left;
		}
		.list-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0.5rem 0;
			border-bottom: 1px solid #eee;
		}
		.modal-overlay {
			position: fixed;
			inset: 0;
			background-color: rgba(0,0,0,0.5);
			display: flex;
			justify-content: center;
			align-items: center;
		}
		.modal {
			background: white;
			padding: 1.5rem;
			border-radius: 1rem;
			width: 300px;
			text-align: center;
		}
		.modal-actions {
			margin-top: 1rem;
			display: flex;
			justify-content: space-between;
		}
		.spinner {
			border: 4px solid #f3f3f3;
			border-top: 4px solid #4a90e2;
			border-radius: 50%;
			width: 36px;
			height: 36px;
			animation: spin 1s linear infinite;
			margin: auto;
		}
		@keyframes spin {
			0% { transform: rotate(0deg); }
			100% { transform: rotate(360deg); }
		}
		.ticket-button {
			background-color: #4a90e2;
			color: white;
			padding: 0.8rem 1.4rem;
			border-radius: 1rem;
			font-weight: 600;
			display: inline-flex;
			align-items: center;
			gap: 0.8rem;
			user-select: none;
			margin-top: 0.5rem;
			width: 100%;
			justify-content: center;
		}
		.ticket-button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.ticket-img {
			width: 28px;
			height: 28px;
		}
	`}</style>
)

export default MainV2
