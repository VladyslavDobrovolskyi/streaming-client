'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../api/ApiClient.ts'

const JoinPage = () => {
	const navigate = useNavigate()
	const { roomId } = useParams<{ roomId: string }>()
	const [step, setStep] = useState<'auth' | 'password' | 'loading' | 'error'>('auth')
	const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
	const [lockImg, setLockImg] = useState('')
	const [authData, setAuthData] = useState({
		username: '',
		password: '',
	})
	const [roomPassword, setRoomPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const getLockImg = async () => {
		const response = await apiClient.getLockImg()

		if (response) {
			setLockImg(response.url)
		}
	}

	useEffect(() => {
		getLockImg()
	}, [])

	useEffect(() => {
		if (!roomId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId)) {
			setError('Invalid room ID')
			setStep('error')
		}
	}, [roomId])

	useEffect(() => {
		const checkAuth = async () => {
			try {
				await apiClient.getUserInfo()
				setStep('password')
			} catch {
				setStep('auth')
			}
		}

		if (roomId) {
			checkAuth()
		}
	}, [roomId])

	const handleAuthSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setIsLoading(true)

		try {
			await apiClient.getTicket(authData)
			setStep('password')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Authentication failed')
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		const checkRoomOwnership = async () => {
			try {
				const isOwner = await apiClient.amIRoomOwner(roomId!)
				if (isOwner) {
					const movieId = await apiClient.roomInfo(roomId!)
					await apiClient.openSeance({
						roomUUID: roomId!,
						movieID: movieId,
					})
					navigate(`/room/${roomId}`)
				}
			} catch (error) {
				console.error('Failed to check room ownership:', error)
			}
		}
		checkRoomOwnership()
	}, [navigate, roomId])

	const handleRoomJoin = async (e?: React.FormEvent) => {
		e?.preventDefault()
		setError('')
		setIsLoading(true)

		try {
			const movieId = await apiClient.roomInfo(roomId!)

			await apiClient.joinRoom({
				roomUUID: roomId!,
				password: roomPassword || undefined,
			})

			await apiClient.openSeance({
				roomUUID: roomId!,
				movieID: movieId,
			})

			navigate(`/room/${roomId}`)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to join room')
		} finally {
			setIsLoading(false)
		}
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

			{step === 'error' && (
				<div className='card error-card'>
					<h2 className='title'>Error</h2>
					<p>{error || 'Invalid room link'}</p>
					<button onClick={() => navigate('/')} className='button primary' disabled={isLoading}>
						Go to Home
					</button>
				</div>
			)}

			{step === 'auth' && (
				<div className='card'>
					<h2 className='title'>{authMode === 'login' ? 'Login to Join Room' : 'Create Account'}</h2>
					{error && <div className='error'>{error}</div>}
					<form onSubmit={handleAuthSubmit}>
						<input
							type='text'
							value={authData.username}
							onChange={e => setAuthData({ ...authData, username: e.target.value })}
							placeholder='Username'
							className='input'
							required
							disabled={isLoading}
							autoComplete='username'
						/>
						<input
							type='password'
							value={authData.password}
							onChange={e => setAuthData({ ...authData, password: e.target.value })}
							placeholder='Password'
							className='input'
							required
							disabled={isLoading}
							autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
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

			{step === 'password' && (
				<div className='join-card'>
					<img src={lockImg} alt='Lock' className='lock-img' />
					<h2 className='title'>Join Room</h2>
					<p className='room-info'>
						You're joining room: <strong>{roomId}</strong>
					</p>
					{error && <div className='error'>{error}</div>}
					<form onSubmit={handleRoomJoin}>
						<input
							type='password'
							value={roomPassword}
							onChange={e => setRoomPassword(e.target.value)}
							placeholder='Room password (if required)'
							className='input'
							disabled={isLoading}
							autoComplete='off'
						/>
						<button type='submit' className='button primary' disabled={isLoading}>
							{isLoading ? 'Joining...' : 'Join Room'}
						</button>
					</form>
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
		.error-card {
			border: 2px solid #c00;
			background-color: #fff0f0;
		}
		.title {
			font-size: 1.5rem;
			margin-bottom: 1rem;
		}
		.room-info {
			text-align: center;
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
			width: 100%;
		}
		.button.primary {
			background-color: #aaa;
			color: #fff;
		}
		.button.primary:disabled {
			opacity: 0.7;
			cursor: not-allowed;
		}
		.button.secondary {
			background: transparent;
			color: #777;
			border: 1px solid #ccc;
		}
		.error {
			color: #c00;
			margin-bottom: 1rem;
		}
		.spinner {
			border: 4px solid #eee;
			border-top: 4px solid #aaa;
			border-radius: 50%;
			width: 40px;
			height: 40px;
			animation: spin 1s linear infinite;
		}
		.lock-img {
			width: 96px;
			height: 96px;
		}
		@keyframes spin {
			0% { transform: rotate(0deg); }
			100% { transform: rotate(360deg); }
		}
		.join-card {
			background: transparent;
			padding: 2rem;
			border-radius: 100%;
			box-shadow: 3px 30px 13px rgba(0,0,0,0.1);
			width: 100%;
			max-width: 420px;
			text-align: center;
		}
	`}</style>
)

export default JoinPage
