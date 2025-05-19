'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/ApiClient.ts'
import socket from '../socket/index.ts'
import type { Movie } from '../api/ApiClient.ts'
import { v4 } from 'uuid'
import ACTIONS from '../socket/actions.ts'

const MainV2 = () => {
	const navigate = useNavigate()
	const [step, setStep] = useState<'welcome' | 'auth' | 'room' | 'movie'>('welcome')
	const [movies, setMovies] = useState<Movie[]>([])
	const [rooms, setRooms] = useState<string[]>([])
	const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null)
	const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
	const [authData, setAuthData] = useState({ username: '', password: '' })
	const [authError, setAuthError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

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

	const handleAuthSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setAuthError('')
		setIsLoading(true)

		try {
			await apiClient.getTicket(authData)
			await fetchMovies()
			setStep('room')
		} catch (error) {
			setAuthError(error instanceof Error ? error.message : 'Authentication failed')
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
					<h2 className='title'>{authMode === 'login' ? 'Login' : 'Register'}</h2>
					{authError && <div className='error'>{authError}</div>}
					<form onSubmit={handleAuthSubmit}>
						<input
							type='text'
							value={authData.username}
							onChange={e => setAuthData({ ...authData, username: e.target.value })}
							placeholder='Username'
							className='input'
							required
							disabled={isLoading}
						/>
						<input
							type='password'
							value={authData.password}
							onChange={e => setAuthData({ ...authData, password: e.target.value })}
							placeholder='Password'
							className='input'
							required
							disabled={isLoading}
						/>
						<button type='submit' className='button primary' disabled={isLoading}>
							{isLoading ? '...' : authMode === 'login' ? 'Login' : 'Register'}
						</button>
						<button
							type='button'
							className='button secondary'
							onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
							disabled={isLoading}
						>
							{authMode === 'login' ? 'Create account' : 'Already have account'}
						</button>
					</form>
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
			padding: 0.6rem 1rem;
			border: none;
			border-radius: 0.75rem;
			font-size: 1rem;
			cursor: pointer;
			margin: 0.5rem 0;
		}
		.button.primary {
			background-color: #aaa;
			color: #fff;
		}
		.button.secondary {
			background: transparent;
			color: #777;
			border: 1px solid #ccc;
		}
		.button.small {
			padding: 0.3rem 0.6rem;
			font-size: 0.9rem;
		}
		.error {
			color: #c00;
			margin-bottom: 1rem;
		}
		.grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
			gap: 1rem;
		}
		.poster {
			cursor: pointer;
			border-radius: 0.75rem;
			overflow: hidden;
			box-shadow: 0 1px 4px rgba(0,0,0,0.1);
			background: #fff;
			transition: transform 0.2s;
		}
		.poster:hover {
			transform: scale(1.03);
		}
		.poster img {
			width: 100%;
			display: block;
		}
		.caption {
			padding: 0.5rem;
			font-size: 0.9rem;
		}
		.list {
			margin-top: 1rem;
			text-align: left;
		}
		.list-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0.5rem 0;
			border-bottom: 1px solid #eee;
		}
		.modal-overlay {
			position: fixed;
			top: 0; left: 0;
			width: 100vw;
			height: 100vh;
			background: rgba(0,0,0,0.3);
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.modal {
			background: white;
			padding: 2rem;
			border-radius: 1rem;
			width: 90%;
			max-width: 400px;
			text-align: center;
		}
		.modal-actions {
			margin-top: 1rem;
			display: flex;
			gap: 1rem;
			justify-content: center;
		}
		.spinner {
			border: 4px solid #eee;
			border-top: 4px solid #aaa;
			border-radius: 50%;
			width: 40px;
			height: 40px;
			animation: spin 1s linear infinite;
		}
		@keyframes spin {
			0% { transform: rotate(0deg); }
			100% { transform: rotate(360deg); }
		}
	`}</style>
)

export default MainV2
