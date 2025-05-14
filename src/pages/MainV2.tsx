import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../socket/index.ts'
import { v4 } from 'uuid'
import ACTIONS from '../socket/actions.ts'
import './mainv2.css' // Import the CSS file

const MainV2: React.FC = () => {
	const navigate = useNavigate()
	const [step, setStep] = useState<'welcome' | 'name' | 'room'>('welcome')
	const [username, setUsername] = useState('')
	const [rooms, setRooms] = useState<string[]>([])
	const [isAuthenticated, setIsAuthenticated] = useState(false)

	// Save current page to session storage
	useEffect(() => {
		const currentEndpoint = window.location.pathname
		sessionStorage.setItem('previousPage', currentEndpoint)
	}, [])

	// Authentication check
	useEffect(() => {
		const token = localStorage.getItem('accessToken')
		setIsAuthenticated(!!token)
		if (!token) navigate('/login')
	}, [navigate])

	// Rooms management
	useEffect(() => {
		const handleShareRooms = ({ rooms = [] }: { rooms: string[] }) => {
			setRooms(rooms)
		}

		socket.on(ACTIONS.SHARE_ROOMS, handleShareRooms)
		return () => {
			socket.off(ACTIONS.SHARE_ROOMS, handleShareRooms)
		}
	}, [])

	const handleNameSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (username.trim()) {
			// Store username in localStorage or context
			localStorage.setItem('username', username)
			setStep('room')
		}
	}

	const createRoom = () => {
		const roomId = v4()
		navigate(`/room/${roomId}`)
	}

	const joinRoom = (roomId: string) => {
		navigate(`/room/${roomId}`)
	}

	if (!isAuthenticated) return null

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

					<button onClick={() => setStep('name')} className='primary-button'>
						I Get It
					</button>
				</div>
			)}

			{step === 'name' && (
				<div className='card'>
					<h2 className='card-title'>Enter Your Name</h2>

					<form onSubmit={handleNameSubmit}>
						<div className='form-group'>
							<input
								type='text'
								value={username}
								onChange={e => setUsername(e.target.value)}
								placeholder='Your display name'
								className='text-input'
								required
							/>
						</div>

						<button type='submit' className='primary-button'>
							Continue
						</button>
					</form>
				</div>
			)}

			{step === 'room' && (
				<div className='card'>
					<h2 className='card-title'>Join or Create a Room</h2>

					<div className='create-room-container'>
						<button onClick={createRoom} className='primary-button create-button'>
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
		</div>
	)
}

export default MainV2
