'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/ApiClient.ts'
import socket from '../socket/index.ts'
import type { Movie } from '../api/ApiClient.ts'
import { v4 } from 'uuid'
import ACTIONS from '../socket/actions.ts'
import './mainv2.css'

const MainV2 = () => {
	const navigate = useNavigate()
	const [step, setStep] = useState<'welcome' | 'auth' | 'room' | 'movie'>('welcome')
	const [movies, setMovies] = useState<Movie[]>([])
	const [rooms, setRooms] = useState<string[]>([])
	const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null)
	const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
	const [authData, setAuthData] = useState({
		username: '',
		password: '',
	})
	const [authError, setAuthError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	// Modal state
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
				<div className='loading-spinner'></div>
			</div>
		)
	}

	return (
		<div className='main-container'>
			{step === 'welcome' && (
				<div className='welcome-card'>
					<h1 className='welcome-title'>Welcome to SyncWatch</h1>
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
						<input
							type='text'
							value={authData.username}
							onChange={e => setAuthData({ ...authData, username: e.target.value })}
							placeholder='Username'
							className='text-input'
							required
							disabled={isLoading}
						/>
						<input
							type='password'
							value={authData.password}
							onChange={e => setAuthData({ ...authData, password: e.target.value })}
							placeholder='Password'
							className='text-input'
							required
							disabled={isLoading}
						/>
						<button type='submit' className='primary-button' disabled={isLoading}>
							{isLoading ? '...' : authMode === 'login' ? 'Login' : 'Register'}
						</button>
						<button
							type='button'
							className='secondary-button'
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
					<h2 className='card-title'>Room Selection</h2>
					<button onClick={() => setStep('movie')} className='primary-button'>
						Create New Room
					</button>
					<div className='rooms-list'>
						{rooms.map(roomID => (
							<div key={roomID} className='room-item'>
								<span>{roomID}</span>
								<button onClick={() => joinRoom(roomID)} className='join-button'>
									Join
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{step === 'movie' && (
				<div className='card'>
					<h2 className='card-title'>Select Movie</h2>
					<div className='movie-grid'>
						{movies.map(movie => (
							<div
								key={movie.id}
								className='movie-poster-container'
								onClick={() => handleSelectMovie(movie.id)}
							>
								<img src={movie.poster} alt={movie.title} />
								<div className='movie-title'>{movie.title}</div>
							</div>
						))}
					</div>
					<button onClick={() => setStep('room')} className='secondary-button'>
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
							className='text-input'
						/>
						<div className='modal-actions'>
							<button className='primary-button' onClick={confirmCreateRoom}>
								Create Room
							</button>
							<button
								className='secondary-button'
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

export default MainV2
