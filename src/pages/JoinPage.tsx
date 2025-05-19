'use client'

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../api/ApiClient.ts'

const styles = {
	mainContainer: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		height: '100vh',
		backgroundColor: '#121212',
		fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
		padding: '1rem',
	},
	card: {
		backgroundColor: '#1f1f1f',
		borderRadius: '12px',
		padding: '2rem 2.5rem',
		boxShadow: '0 4px 15px rgba(0, 0, 0, 0.7)',
		width: '100%',
		maxWidth: 420,
		color: '#eeeeee',
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '1.2rem',
	},
	errorCard: {
		border: '2px solid #ff4c4c',
		backgroundColor: '#330000',
		color: '#ff4c4c',
	},
	cardTitle: {
		fontSize: '1.75rem',
		fontWeight: 700,
		marginBottom: '1rem',
		textAlign: 'center' as const,
		color: '#fafafa',
	},
	errorMessage: {
		backgroundColor: '#ff4c4c',
		color: '#fff',
		padding: '0.7rem 1rem',
		borderRadius: 6,
		fontWeight: 600,
		textAlign: 'center' as const,
	},
	textInput: {
		width: '100%',
		padding: '0.8rem 1rem',
		borderRadius: 8,
		border: 'none',
		outline: 'none',
		fontSize: '1rem',
		backgroundColor: '#2a2a2a',
		color: '#fafafa',
		transition: 'background 0.3s ease',
		marginBottom: '1rem',
	},
	textInputFocus: {
		backgroundColor: '#3a3a3a',
		boxShadow: '0 0 6px #3a86ff',
	},
	primaryButton: {
		backgroundColor: '#3a86ff',
		color: 'white',
		border: 'none',
		padding: '0.85rem 1rem',
		borderRadius: 8,
		fontWeight: 600,
		fontSize: '1.1rem',
		cursor: 'pointer',
		transition: 'background 0.25s ease',
		marginBottom: '0.5rem',
	},
	primaryButtonDisabled: {
		backgroundColor: '#5a98ff',
		cursor: 'not-allowed',
	},
	secondaryButton: {
		backgroundColor: 'transparent',
		color: '#3a86ff',
		border: 'none',
		cursor: 'pointer',
		fontWeight: 600,
		fontSize: '1rem',
		textDecoration: 'underline',
	},
	loadingSpinner: {
		width: 48,
		height: 48,
		border: '5px solid #3a86ff',
		borderTop: '5px solid transparent',
		borderRadius: '50%',
		animation: 'spin 1s linear infinite',
		margin: 'auto',
	},
}

// Спиннер — CSS анимация
const spinnerStyle = `
@keyframes spin {
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
}
`

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
			await apiClient.getTicket(authData) // login и register один и тот же метод? Возможно, надо различать

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

	if (step === 'error') {
		return (
			<>
				<style>{spinnerStyle}</style>
				<div style={styles.mainContainer}>
					<div style={{ ...styles.card, ...styles.errorCard }}>
						<h2 style={styles.cardTitle}>Error</h2>
						<p>{error || 'Invalid room link'}</p>
						<button
							style={{ ...styles.primaryButton, ...(isLoading ? styles.primaryButtonDisabled : {}) }}
							onClick={() => navigate('/')}
							disabled={isLoading}
						>
							Go to Home
						</button>
					</div>
				</div>
			</>
		)
	}

	if (step === 'loading') {
		return (
			<>
				<style>{spinnerStyle}</style>
				<div style={styles.mainContainer}>
					<div style={styles.loadingSpinner}></div>
				</div>
			</>
		)
	}

	if (step === 'auth') {
		return (
			<>
				<style>{spinnerStyle}</style>
				<div style={styles.mainContainer}>
					<div style={styles.card}>
						<h2 style={styles.cardTitle}>
							{authMode === 'login' ? 'Login to Join Room' : 'Create Account'}
						</h2>
						{error && <div style={styles.errorMessage}>{error}</div>}
						<form onSubmit={handleAuthSubmit}>
							<input
								type='text'
								value={authData.username}
								onChange={e => setAuthData({ ...authData, username: e.target.value })}
								placeholder='Username'
								style={styles.textInput}
								required
								disabled={isLoading}
								autoComplete='username'
							/>
							<input
								type='password'
								value={authData.password}
								onChange={e => setAuthData({ ...authData, password: e.target.value })}
								placeholder='Password'
								style={styles.textInput}
								required
								disabled={isLoading}
								autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
							/>
							<button type='submit' style={styles.primaryButton} disabled={isLoading}>
								{isLoading ? '...' : authMode === 'login' ? 'Login' : 'Register'}
							</button>
							<button
								type='button'
								style={styles.secondaryButton}
								onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
								disabled={isLoading}
							>
								{authMode === 'login' ? 'Create account' : 'Already have account'}
							</button>
						</form>
					</div>
				</div>
			</>
		)
	}

	if (step === 'password') {
		return (
			<>
				<style>{spinnerStyle}</style>
				<div style={styles.mainContainer}>
					<div style={styles.card}>
						<h2 style={styles.cardTitle}>Join Room</h2>
						<p style={{ textAlign: 'center', marginBottom: '1rem' }}>
							You're joining room: <strong>{roomId}</strong>
						</p>
						{error && <div style={styles.errorMessage}>{error}</div>}
						<form onSubmit={handleRoomJoin}>
							<input
								type='password'
								value={roomPassword}
								onChange={e => setRoomPassword(e.target.value)}
								placeholder='Room password (if required)'
								style={styles.textInput}
								disabled={isLoading}
								autoComplete='off'
							/>
							<button type='submit' style={styles.primaryButton} disabled={isLoading}>
								{isLoading ? 'Joining...' : 'Join Room'}
							</button>
						</form>
					</div>
				</div>
			</>
		)
	}

	return null
}

export default JoinRoomPage
