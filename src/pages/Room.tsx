import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router'
import { useNavigate } from 'react-router-dom'
import useWebRTC, { LOCAL_VIDEO } from '../hooks/useWebRTC'
import ACTIONS from '../socket/actions'
import socket from '../socket'

function layout(clientsNumber = 1) {
	const pairs = Array.from({ length: clientsNumber }).reduce((acc: [number, number?][], _next, index, arr) => {
		if (index % 2 === 0) {
			acc.push([index, index + 1 < arr.length ? index + 1 : undefined])
		}
		return acc
	}, [])

	const rowsNumber = pairs.length
	const height = `${100 / rowsNumber}%`

	return pairs
		.map((row, index, arr) => {
			if (index === arr.length - 1 && row.length === 1) {
				return [
					{
						width: '100%',
						height,
					},
				]
			}

			return row.map(() => ({
				width: '50%',
				height,
			}))
		})
		.flat()
}

export default function Room() {
	const { id: roomID } = useParams()
	const { clients, provideMediaRef, localStream, reinitializeStream } = useWebRTC(roomID!)
	const videoLayout = layout(clients.length)
	const videoRef = useRef<HTMLVideoElement>(null)
	const [isPlaying, setIsPlaying] = useState(false)
	const [isMuted, setIsMuted] = useState(true)
	const [micMuted, setMicMuted] = useState(false) // Add state for mic mute
	const [cameraMuted, setCameraMuted] = useState(false) // Add state for camera mute
	const navigate = useNavigate()
	const [error, setError] = useState<string | null>(null)
	const isSyncingRef = useRef(false)

	// Сохраняем ID комнаты в sessionStorage, чтобы восстановить соединение после обновления
	useEffect(() => {
		if (roomID) {
			sessionStorage.setItem('roomID', roomID)
		}
	}, [roomID])

	// Восстановление комнаты после обновления страницы
	useEffect(() => {
		const storedRoomID = sessionStorage.getItem('roomID')
		if (!roomID && storedRoomID) {
			navigate(`/room/${storedRoomID}`, { replace: true })
		}
	}, [roomID, navigate])

	useEffect(() => {
		const reconnect = () => {
			console.log('Переподключение к комнате...');
			socket.emit(ACTIONS.JOIN, { roomID });
			reinitializeStream(); // Перезапускаем медиа
		};
	
		socket.on('disconnect', reconnect);
		return () => socket.off('disconnect', reconnect);
	}, [roomID, reinitializeStream]);

	useEffect(() => {
		if (!localStream) {
			reinitializeStream();
		}
	}, [localStream, reinitializeStream]);

	const checkStreamAvailability = async () => {
		try {
			const response = await fetch('/movie/movie.mkv')
			if (!response.ok) {
				setError('Movie is currently unavailable')
				return
			}

			if (videoRef.current) {
				const mediaElement = videoRef.current
				mediaElement.src = '/movie/movie.mkv'
				mediaElement.load()

				// Request sync on first load
				socket.emit(ACTIONS.REQUEST_SYNC, { roomID })
			}
		} catch {
			setError('An error occurred while fetching the movie')
		}
	}
	// Sync handlers
	useEffect(() => {
		const handlePlay = ({ time }: { time: number }) => {
			if (!videoRef.current || isSyncingRef.current) return

			isSyncingRef.current = true
			videoRef.current.currentTime = time
			videoRef.current.play().finally(() => {
				isSyncingRef.current = false
				setIsPlaying(true)
			})
		}

		const handlePause = ({ time }: { time: number }) => {
			if (!videoRef.current || isSyncingRef.current) return

			isSyncingRef.current = true
			videoRef.current.currentTime = time
			videoRef.current.pause()
			isSyncingRef.current = false
			setIsPlaying(false)
		}

		const handleSeek = ({ time }: { time: number }) => {
			if (!videoRef.current || isSyncingRef.current) return

			isSyncingRef.current = true
			videoRef.current.currentTime = time
			isSyncingRef.current = false
		}

		const handleSyncRequest = () => {
			if (videoRef.current) {
				const currentTime = videoRef.current.currentTime
				const isPlaying = !videoRef.current.paused
				socket.emit(ACTIONS.SYNC_STATE, {
					roomID,
					time: currentTime,
					isPlaying,
				})
			}
		}

		socket.on(ACTIONS.VIDEO_PLAY, handlePlay)
		socket.on(ACTIONS.VIDEO_PAUSE, handlePause)
		socket.on(ACTIONS.VIDEO_SEEK, handleSeek)
		socket.on(ACTIONS.REQUEST_SYNC, handleSyncRequest)

		return () => {
			socket.off(ACTIONS.VIDEO_PLAY, handlePlay)
			socket.off(ACTIONS.VIDEO_PAUSE, handlePause)
			socket.off(ACTIONS.VIDEO_SEEK, handleSeek)
			socket.off(ACTIONS.REQUEST_SYNC, handleSyncRequest)
		}
	}, [roomID])

	useEffect(() => {
		checkStreamAvailability()
	}, [])

	const handlePlayPause = () => {
		if (!videoRef.current) return

		const mediaElement = videoRef.current
		const currentTime = mediaElement.currentTime

		if (mediaElement.paused) {
			mediaElement.play().catch(console.error)
			socket.emit(ACTIONS.VIDEO_PLAY, { roomID, time: currentTime })
		} else {
			mediaElement.pause()
			socket.emit(ACTIONS.VIDEO_PAUSE, { roomID, time: currentTime })
		}
		setIsPlaying(!mediaElement.paused)
	}

	const handleMuteUnmute = () => {
		if (videoRef.current) {
			const mediaElement = videoRef.current
			mediaElement.muted = !mediaElement.muted
			setIsMuted(mediaElement.muted)
		}
	}

	const handleMicMuteUnmute = () => {
		if (localStream) {
			const audioTracks = localStream.getAudioTracks()
			if (audioTracks.length > 0) {
				const track = audioTracks[0]
				track.enabled = !track.enabled
				setMicMuted(!track.enabled)
			}
		}
	}
	const handleCameraMuteUnmute = () => {
		if (localStream) {
			const videoTracks = localStream.getVideoTracks()
			if (videoTracks.length > 0) {
				const track = videoTracks[0]
				track.enabled = !track.enabled // Toggle video track state
				setCameraMuted(!track.enabled) // Update camera state
			}
		}
	}

	const handleSeek = useCallback(
		(time: number) => {
			if (!videoRef.current || isSyncingRef.current) return

			isSyncingRef.current = true
			videoRef.current.currentTime = time
			socket.emit(ACTIONS.VIDEO_SEEK, {
				roomID,
				time,
			})
			isSyncingRef.current = false
		},
		[roomID]
	)

	const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect()
		const percent = (e.clientX - rect.left) / rect.width
		const time = percent * (videoRef.current?.duration || 0)
		handleSeek(time)
	}

	if (error) {
		return (
			<div className='Room'>
				<h1>{error}</h1>
			</div>
		)
	}

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexWrap: 'wrap',
				height: '100vh',
			}}
		>
			{clients.map((clientID, index) => (
				<div key={clientID} style={videoLayout[index]} id={clientID}>
					<video
						width='100%'
						height='100%'
						ref={instance => provideMediaRef(clientID, instance)}
						autoPlay
						playsInline
						muted={clientID === LOCAL_VIDEO}
					/>
				</div>
			))}
			<div style={{ width: '100%', height: 'auto', marginTop: '20px' }}>
				<video
					ref={videoRef}
					width='100%'
					height='auto'
					controls={true}
					muted={isMuted}
					playsInline
					onPlay={() => setIsPlaying(true)}
					onPause={() => setIsPlaying(false)}
					style={{ cursor: 'pointer', backgroundColor: '#000' }}
					onClick={handlePlayPause}
				/>
				<div
					style={{
						position: 'relative',
						width: '100%',
						height: '5px',
						background: 'rgba(255,255,255,0.2)',
						cursor: 'pointer',
					}}
					onClick={handleProgressClick}
				>
					<div
						style={{
							width: `${
								((videoRef.current?.currentTime || 0) / (videoRef.current?.duration || 1)) * 100
							}%`,
							height: '100%',
							background: '#fff',
							transition: 'width 0.1s linear',
						}}
					/>
				</div>
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
					<button
						onClick={handleMicMuteUnmute}
						style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}
					>
						{micMuted ? 'Unmute Mic' : 'Mute Mic'}
					</button>
					<button
						onClick={handleCameraMuteUnmute}
						style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}
					>
						{cameraMuted ? 'Unmute Camera' : 'Mute Camera'}
					</button>
				</div>
			</div>
		</div>
	)
}
