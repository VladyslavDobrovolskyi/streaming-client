import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../socket'
import Hls from 'hls.js'
import { v4 } from 'uuid'
import ACTIONS from '../socket/actions'

const Main: React.FC = () => {
	const videoRef = useRef<HTMLVideoElement>(null)
	const [isPlaying, setIsPlaying] = useState(true)
	const [isMuted, setIsMuted] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const hlsRef = useRef<Hls | null>(null)
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const navigate = useNavigate()
	const [rooms, updateRooms] = useState([])
	const rootNode = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const token = localStorage.getItem('accessToken')
		if (token) {
			setIsAuthenticated(true)
		}
	}, [])

	useEffect(() => {
		socket.on(ACTIONS.SHARE_ROOMS, ({ rooms = [] } = {}) => {
			if (rootNode.current) {
				updateRooms(rooms)
			}
		})
	}, [])

	const checkStreamAvailability = async () => {
		try {
			const response = await fetch('https://streaming.vladyslavdobrovolskyi.tech/stream/playlist.m3u8', {
				headers: new Headers({
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					Pragma: 'no-cache',
					Expires: '0',
				}),
			})

			// Добавляем проверку MIME-типа
			const contentType = response.headers.get('Content-Type')
			if (!contentType?.includes('application/vnd.apple.mpegurl')) {
				setError('Invalid MIME type for HLS stream')
				return
			}

			if (Hls.isSupported() && videoRef.current) {
				const hls = new Hls({
					liveSyncDurationCount: 1,
					lowLatencyMode: true,
					xhrSetup: xhr => {
						xhr.withCredentials = false // Отключаем CORS credentials
					},
					debug: true, // Включаем отладку
				})

				// Добавляем обработчик ошибок медиа
				videoRef.current.addEventListener('error', () => {
					console.error('Video Error:', videoRef.current?.error)
				})

				hls.on(Hls.Events.ERROR, (_event, data) => {
					if (data.fatal) {
						switch (data.type) {
							case Hls.ErrorTypes.NETWORK_ERROR:
								console.error('Fatal network error:', data.details)
								hls.startLoad()
								break
							case Hls.ErrorTypes.MEDIA_ERROR:
								console.error('Fatal media error:', data.details)
								hls.recoverMediaError()
								break
							default:
								hls.destroy()
								break
						}
					}
				})

				// Остальной код остается прежним...
			}
		} catch (err) {
			console.error('Stream check failed:', err)
			setError('Failed to initialize stream')
		}
	}

	useEffect(() => {
		checkStreamAvailability()
	}, [])

	const handlePlayPause = () => {
		if (videoRef.current) {
			const mediaElement = videoRef.current
			if (mediaElement.paused) {
				if (hlsRef.current) {
					hlsRef.current.startLoad(-1) // Загрузить последний сегмент
				}
				mediaElement.play().catch(error => console.error('Play error:', error))
				setIsPlaying(true)
			} else {
				if (hlsRef.current) {
					hlsRef.current.stopLoad() // Остановить загрузку сегментов
				}
				mediaElement.pause()
				setIsPlaying(false)
			}
		}
	}

	const handleMuteUnmute = () => {
		if (videoRef.current) {
			const mediaElement = videoRef.current
			mediaElement.muted = !mediaElement.muted
			setIsMuted(mediaElement.muted)
		}
	}

	const testGetUsers = async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch('https://streaming.vladyslavdobrovolskyi.tech/api/users', {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			const data = await response.json()
			console.log('Users:', data)
		} catch (error) {
			console.error('Error fetching users:', error)
		}
	}

	const testGetRooms = async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch('https://streaming.vladyslavdobrovolskyi.tech/api/room_reservations', {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			const data = await response.json()
			console.log('Room Reservations:', data)
		} catch (error) {
			console.error('Error fetching room reservations:', error)
		}
	}

	if (!isAuthenticated) {
		navigate(`/login`)
	}

	if (error) {
		return (
			<div className='Main'>
				<h1>{error}</h1>
			</div>
		)
	}

	return (
		<div className='Main'>
			<h1>Live Stream!!!</h1>
			<video
				ref={videoRef}
				width='100%'
				height='auto'
				controls={false}
				muted={isMuted}
				autoPlay
				playsInline
				crossOrigin='anonymous'
			/>
			<div style={{ marginTop: '10px' }}>
				<button onClick={handlePlayPause} style={{ padding: '10px 20px', fontSize: '16px' }}>
					{isPlaying ? 'Pause' : 'Play'}
				</button>
				<button
					onClick={handleMuteUnmute}
					style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}
				>
					{isMuted ? 'Unmute' : 'Mute'}
				</button>
			</div>
			<div style={{ marginTop: '20px' }}>
				<button onClick={testGetUsers} style={{ padding: '10px 20px', fontSize: '16px' }}>
					Test Get Users
				</button>
				<button onClick={testGetRooms} style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}>
					Test Get Room Reservations
				</button>
			</div>
			<div ref={rootNode}>
				<h1>Available Rooms</h1>

				<ul>
					{rooms.map(roomID => (
						<li key={roomID}>
							{roomID}
							<button
								onClick={() => {
									navigate(`/room/${roomID}`)
								}}
							>
								JOIN ROOM
							</button>
						</li>
					))}
				</ul>

				<button
					onClick={() => {
						navigate(`/room/${v4()}`)
					}}
				>
					Create New Room
				</button>
			</div>
		</div>
	)
}

export default Main
