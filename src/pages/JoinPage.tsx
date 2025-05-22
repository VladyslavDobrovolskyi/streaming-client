'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../api/ApiClient.ts'
import Loader from '../components/player/Loader.tsx'

type Step = 'init' | 'auth' | 'password' | 'loading' | 'error'

const JoinPage = () => {
	const navigate = useNavigate()
	const { roomId } = useParams<{ roomId: string }>()
	const [step, setStep] = useState<Step>('init')
	const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
	const [lockImg, setLockImg] = useState('')
	const [authData, setAuthData] = useState({
		username: '',
		password: '',
	})
	const [roomPassword, setRoomPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false) // New loading state
	const [inputError, setInputError] = useState(false)
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
		const checkAuthAndOwnership = async () => {
			try {
				setIsLoading(true)
				await apiClient.getUserInfo()

				const isOwner = await apiClient.amIRoomOwner(roomId!)

				if (isOwner) {
					const movieId = await apiClient.roomInfo(roomId!)
					await apiClient.openSeance({
						roomUUID: roomId!,
						movieID: movieId,
					})
					navigate(`/room/${roomId}`)
				} else {
					setStep('password')
				}
			} catch {
				setStep('auth')
			} finally {
				setIsLoading(false)
			}
		}

		if (roomId) {
			checkAuthAndOwnership()
		} else {
			setStep('error')
			setError('Invalid room link')
		}
	}, [navigate, roomId])

	const handleAuthSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setIsLoading(true)

		try {
			await apiClient.getTicket(authData)
			const isOwner = await apiClient.amIRoomOwner(roomId!)

			if (isOwner) {
				const movieId = await apiClient.roomInfo(roomId!)
				await apiClient.openSeance({
					roomUUID: roomId!,
					movieID: movieId,
				})
				navigate(`/room/${roomId}`)
			} else {
				setStep('password')
			}
		} catch (err) {
			setStep('auth')
			setError(err instanceof Error ? err.message : 'Authentication failed')
		} finally {
			setIsLoading(false)
		}
	}

	const handleRoomJoin = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')

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
			setStep('password')
			setError(err instanceof Error ? err.message : 'Failed to join room')
			setInputError(true)
			setTimeout(() => setInputError(false), 1700) // Сбрасываем ошибку через 3 секунды
		}
	}

	if (step === 'init' || isLoading) {
		return (
			<div className='main-container'>
				<Loader color='#4a90e2' />
				<Styles />
			</div>
		)
	}

	if (step === 'error') {
		return (
			<div className='main-container'>
				<div className='card error-card'>
					<h2 className='title'>Error</h2>
					<p>{error}</p>
					<button onClick={() => navigate('/')} className='button primary'>
						Go to Home
					</button>
				</div>
				<Styles />
			</div>
		)
	}

	return (
		<div className='main-container'>
			<Styles />

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
					<form onSubmit={handleRoomJoin}>
						<input
							type='password'
							value={roomPassword}
							onChange={e => setRoomPassword(e.target.value)}
							placeholder='Room password (if required)'
							className={`input ${inputError ? 'error-input' : ''}`}
							disabled={isLoading}
							autoComplete='off'
							onKeyDown={e => {
								if (e.key === 'Enter') {
									handleRoomJoin(e)
								}
							}}
						/>
						<button type='submit' className='button primary' disabled={isLoading || !roomPassword}>
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
            width: 92%;
            padding: 0.75rem;
            margin-bottom: 1rem;
            border: 1px solid #ccc;
            border-radius: 0.75rem;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        }

        .error-input {
            border-color: #ff4444;
            animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
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
            background-color: #4a90e2;
            color: #fff;
            width: 40%;
        }
        .button.primary:disabled {
            opacity: 0.7;
			background-color: #ccc;
			color: #ccc;
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
