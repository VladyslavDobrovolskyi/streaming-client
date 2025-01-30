import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../socket'
import Hls from 'hls.js'
import { v4 } from 'uuid'
import ACTIONS from '../socket/actions'

const Main: React.FC = () => {
	const videoRef = useRef<HTMLVideoElement>(null)
	const [isPlaying, setIsPlaying] = useState(false)
	const [isMuted, setIsMuted] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const hlsRef = useRef<Hls | null>(null)
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const navigate = useNavigate()
	const [rooms, setRooms] = useState<string[]>([])
	const rootNode = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const currentEndpoint = window.location.pathname // Получаем только путь
		sessionStorage.setItem('previousPage', currentEndpoint) // Сохраняем в sessionStorage
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
			if (rootNode.current) setRooms(rooms)
		}

		socket.on(ACTIONS.SHARE_ROOMS, handleShareRooms)
		return () => {
			socket.off(ACTIONS.SHARE_ROOMS, handleShareRooms)
		}
	}, [])

	// HLS Player initialization
	const initializePlayer = useCallback(async () => {
		try {
			setIsLoading(true)
			const response = await fetch('https://streaming.vladyslavdobrovolskyi.tech/stream/playlist.m3u8', {
				cache: 'no-cache',
				headers: {
					Pragma: 'no-cache',
					Expires: '0',
				},
			})

			if (!response.ok) throw new Error(`HTTP ${response.status}`)
			if (!response.headers.get('Content-Type')?.includes('application/vnd.apple.mpegurl')) {
				throw new Error('Invalid MIME type')
			}

			if (Hls.isSupported() && videoRef.current) {
				const hls = new Hls({
					autoStartLoad: false,
					liveSyncDurationCount: 1,
					lowLatencyMode: true,
					xhrSetup: xhr => {
						xhr.withCredentials = false
					},
					debug: false,
				})

				hlsRef.current = hls
				const media = videoRef.current

				hls.loadSource(response.url)
				hls.attachMedia(media)

				hls.on(Hls.Events.MANIFEST_PARSED, () => {
					console.log('Manifest parsed, ready to play')
				})

				hls.on(Hls.Events.ERROR, (_, data) => {
					if (data.fatal) {
						switch (data.type) {
							case Hls.ErrorTypes.NETWORK_ERROR:
								hls.startLoad()
								break
							case Hls.ErrorTypes.MEDIA_ERROR:
								hls.recoverMediaError()
								break
							default:
								hls.destroy()
								setError('Fatal playback error')
						}
					}
				})
			}
		} catch (err) {
			console.error('Stream initialization failed:', err)
			setError('Stream is currently unavailable')
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Initial setup effect
	useEffect(() => {
		if (!isAuthenticated) return

		initializePlayer()

		return () => {
			if (hlsRef.current) {
				hlsRef.current.destroy()
				hlsRef.current = null
			}
		}
	}, [isAuthenticated, initializePlayer])

	// Play/pause handler
	const handlePlayPause = useCallback(async () => {
		if (!videoRef.current || !hlsRef.current) return

		const media = videoRef.current
		try {
			if (media.paused) {
				setIsLoading(true)
				hlsRef.current.startLoad(-1)
				await media.play()
				setIsPlaying(true)
			} else {
				media.pause()
				hlsRef.current.stopLoad()
				setIsPlaying(false)
			}
		} catch (err) {
			console.error('Playback control error:', err)
			if (err instanceof Error) {
				setError(
					err.name === 'NotAllowedError' ? 'Please click the page first to start playback' : 'Playback error'
				)
			}
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Mute handler
	const handleMute = useCallback(() => {
		if (videoRef.current) {
			videoRef.current.muted = !videoRef.current.muted
			setIsMuted(videoRef.current.muted)
		}
	}, [])

	// User interaction handler
	useEffect(() => {
		const handleFirstInteraction = () => {
			if (videoRef.current?.paused) handlePlayPause()
			document.removeEventListener('click', handleFirstInteraction)
		}

		document.addEventListener('click', handleFirstInteraction)
		return () => document.removeEventListener('click', handleFirstInteraction)
	}, [handlePlayPause])

	// API test handlers
	const testGetUsers = useCallback(async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch('https://streaming.vladyslavdobrovolskyi.tech/api/users', {
				headers: { Authorization: `Bearer ${token}` },
			})
			console.log('Users:', await response.json())
		} catch (err) {
			console.error('Users fetch error:', err)
		}
	}, [])

	const testGetRooms = useCallback(async () => {
		try {
			const token = localStorage.getItem('token')
			const response = await fetch('https://streaming.vladyslavdobrovolskyi.tech/api/room_reservations', {
				headers: { Authorization: `Bearer ${token}` },
			})
			console.log('Rooms:', await response.json())
		} catch (err) {
			console.error('Rooms fetch error:', err)
		}
	}, [])

	if (!isAuthenticated) return null

	if (error) {
		return (
			<div className='Main'>
				<h1>{error}</h1>
				<button onClick={() => window.location.reload()}>Retry</button>
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
				playsInline
				onPlay={() => setIsPlaying(true)}
				onPause={() => setIsPlaying(false)}
				style={{ cursor: 'pointer', backgroundColor: '#000' }}
				onClick={handlePlayPause}
			/>

			<div style={{ marginTop: 10 }}>
				<button onClick={handlePlayPause} disabled={isLoading} style={{ padding: '10px 20px', fontSize: 16 }}>
					{isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
				</button>
				<button onClick={handleMute} style={{ padding: '10px 20px', fontSize: 16, marginLeft: 10 }}>
					{isMuted ? 'Unmute' : 'Mute'}
				</button>
			</div>

			<div style={{ marginTop: 20 }}>
				<button onClick={testGetUsers} style={{ padding: '10px 20px', fontSize: 16 }}>
					Test Get Users
				</button>
				<button onClick={testGetRooms} style={{ padding: '10px 20px', fontSize: 16, marginLeft: 10 }}>
					Test Get Rooms
				</button>
			</div>

			<div ref={rootNode} style={{ marginTop: 30 }}>
				<h2>Available Rooms</h2>
				{rooms.length > 0 ? (
					<ul style={{ listStyle: 'none', padding: 0 }}>
						{rooms.map(roomID => (
							<li key={roomID} style={{ margin: '10px 0' }}>
								<span style={{ marginRight: 10 }}>{roomID}</span>
								<button onClick={() => navigate(`/room/${roomID}`)} style={{ padding: '5px 15px' }}>
									Join
								</button>
							</li>
						))}
					</ul>
				) : (
					<p>No rooms available</p>
				)}

				<button onClick={() => navigate(`/room/${v4()}`)} style={{ marginTop: 10, padding: '10px 20px' }}>
					Create New Room
				</button>
			</div>
		</div>
	)
}

export default Main
