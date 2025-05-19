'use client'

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../api/ApiClient.ts'
import './mainv2.css'

const JoinRoomPage = () => {
	const navigate = useNavigate()
	const { roomId } = useParams<{ roomId: string }>()
	const [step, setStep] = useState<'auth' | 'password' | 'loading' | 'error'>('auth')
	const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
	const [authData, setAuthData] = useState({
		username: '',
		password: '',
	})
	const [roomPassword, setRoomPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	// Проверяем валидность roomId при загрузке
	useEffect(() => {
		if (!roomId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId)) {
			setError('Invalid room ID')
			setStep('error')
		}
	}, [roomId])

	// Проверяем авторизацию пользователя
	useEffect(() => {
		const checkAuth = async () => {
			try {
				await apiClient.getUserInfo()
				// Если пользователь уже авторизован, проверяем пароль комнаты
				setStep('password')
			} catch {
				// Пользователь не авторизован - показываем форму входа
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
			if (authMode === 'login') {
				await apiClient.login(authData)
			} else {
				await apiClient.register(authData)
			}

			// После успешной аутентификации проверяем пароль комнаты
			setStep('password')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Authentication failed')
		} finally {
			setIsLoading(false)
		}
	}

	const handleRoomJoin = async (e?: React.FormEvent) => {
		e?.preventDefault()
		setError('')
		setIsLoading(true)

		const isOwner = await apiClient.amIRoomOwner(roomId!)
		const movieId = await apiClient.roomInfo(roomId!)

		if (isOwner) {
			await apiClient.openSeance({
				roomUUID: roomId!,
				movieID: movieId,
			})
			navigate(`/room/${roomId}`)
		}

		try {
			await apiClient.joinRoom({
				roomUUID: roomId!,
				password: roomPassword || undefined,
			})

			await apiClient.openSeance({
				roomUUID: roomId!,
				movieID: movieId,
			})

			// Успешное подключение - переходим в комнату
			navigate(`/room/${roomId}`)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to join room')
		} finally {
			setIsLoading(false)
		}
	}

	if (step === 'error') {
		return (
			<div className='main-container'>
				<div className='card error-card'>
					<h2>Error</h2>
					<p>{error || 'Invalid room link'}</p>
					<button onClick={() => navigate('/')} className='primary-button'>
						Go to Home
					</button>
				</div>
			</div>
		)
	}

	if (step === 'loading') {
		return (
			<div className='main-container'>
				<div className='loading-spinner'></div>
			</div>
		)
	}

	if (step === 'auth') {
		return (
			<div className='main-container'>
				<div className='card'>
					<h2 className='card-title'>{authMode === 'login' ? 'Login to Join Room' : 'Create Account'}</h2>
					{error && <div className='error-message'>{error}</div>}
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
			</div>
		)
	}

	if (step === 'password') {
		return (
			<div className='main-container'>
				<div className='card'>
					<h2 className='card-title'>Join Room</h2>
					<p>You're joining room: {roomId}</p>
					{error && <div className='error-message'>{error}</div>}
					<form onSubmit={handleRoomJoin}>
						<input
							type='password'
							value={roomPassword}
							onChange={e => setRoomPassword(e.target.value)}
							placeholder='Room password (if required)'
							className='text-input'
							disabled={isLoading}
						/>
						<button type='submit' className='primary-button' disabled={isLoading}>
							{isLoading ? 'Joining...' : 'Join Room'}
						</button>
					</form>
				</div>
			</div>
		)
	}

	return null
}

export default JoinRoomPage
