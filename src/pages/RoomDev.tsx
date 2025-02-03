import { useState, useRef, useEffect, useCallback } from 'react'
import ReactPlayer from 'react-player'
import {
	PauseIcon,
	PlayIcon,
	SpeakerLoudIcon,
	SpeakerOffIcon,
	SpeakerQuietIcon,
	SpeakerModerateIcon,
	EnterFullScreenIcon,
	ExitFullScreenIcon,
	DoubleArrowLeftIcon,
	DoubleArrowRightIcon,
	EyeOpenIcon,
	EyeClosedIcon,
	SquareIcon,
	MoveIcon,
} from '@radix-ui/react-icons'
import { FaMicrophoneAlt, FaMicrophoneAltSlash } from 'react-icons/fa'
import { BsCameraVideoFill, BsCameraVideoOffFill } from 'react-icons/bs'
import { Slider } from '@radix-ui/themes'
import ActionIndicator from '../components/ActionIndicator'
import { useParams } from 'react-router'
import useWebRTC, { LOCAL_VIDEO } from '../hooks/useWebRTC'
import useRoomSync from '../hooks/useRoomSync'

const createDashedSquareDragImage = () => {
	const dragImage = document.createElement('div')
	dragImage.style.width = '150px'
	dragImage.style.height = '100px'
	dragImage.style.border = '2px dashed rgba(255, 255, 255, 0.5)'
	dragImage.style.padding = '5px'
	dragImage.style.boxSizing = 'border-box'
	dragImage.style.backgroundColor = 'rgba(0, 0, 0, 0.2)'
	dragImage.style.position = 'absolute'
	dragImage.style.top = '-1000px'
	dragImage.style.left = '-1000px'
	dragImage.style.zIndex = '1000'
	document.body.appendChild(dragImage)

	// Принудительно применяем стили
	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	window.getComputedStyle(dragImage).opacity

	return dragImage
}

export default function RoomDev() {
	const [isPlaying, setIsPlaying] = useState(false)
	const [volume, setVolume] = useState(0.8)
	const [muted, setMuted] = useState(false)
	const [played, setPlayed] = useState(0)
	const [loaded, setLoaded] = useState(0)
	const [showControls, setShowControls] = useState(false)
	const [showVolumeControl, setShowVolumeControl] = useState(false)
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [duration, setDuration] = useState(300)
	const [isDragging, setIsDragging] = useState(false)
	const [isVolumeActive, setIsVolumeActive] = useState(false)
	const [mutedBySlider, setMutedBySlider] = useState(false)
	const [currentAction, setCurrentAction] = useState<
		'play' | 'pause' | 'mute' | 'unmute' | 'forward' | 'backward' | 'volume' | null
	>(null)
	const [micMuted, setMicMuted] = useState(false)
	const [cameraMuted, setCameraMuted] = useState(false)
	const [hoveredClient, setHoveredClient] = useState<string | null>(null)
	const [clientVolumes, setClientVolumes] = useState<Record<string, number>>({})
	const [previousVolumes, setPreviousVolumes] = useState<Record<string, number>>({})
	const [coveredClients, setCoveredClients] = useState<Record<string, boolean>>({})
	const [isMovieMode, setIsMovieMode] = useState(false)
	const [clientPositions, setClientPositions] = useState<Record<string, { x: number; y: number }>>({})
	const [draggingClient, setDraggingClient] = useState<string | null>(null) // Added draggingClient state
	const [hideUsers, setHideUsers] = useState<boolean | (() => void)>(false) // Added hideUsers state
	const playerRef = useRef<ReactPlayer>(null)
	const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const playerWrapperRef = useRef<HTMLDivElement>(null)
	const sliderRef = useRef<HTMLDivElement>(null)
	const previousVolumeRef = useRef(volume)

	const { id: roomID } = useParams()
	const { clients, provideMediaRef, localStream, reinitializeStream } = useWebRTC(roomID!)
	const { emitPlay, emitPause, emitSeek, requestSync, lastSeekDirection } = useRoomSync(roomID!, playerRef)

	useEffect(() => {}, [hideUsers])

	useEffect(() => {
		if (loaded) {
			console.log('loaded')
		}
	}, [loaded])

	useEffect(() => {
		if (lastSeekDirection) {
			showAction(lastSeekDirection)
			console.log('Showing seek action:', lastSeekDirection)
		}
	}, [lastSeekDirection])

	const handleForward15 = () => {
		const currentTime = playerRef.current?.getCurrentTime() || 0
		const newTime = Math.min(currentTime + 15, duration)
		playerRef.current?.seekTo(newTime, 'seconds')
		setPlayed(newTime / duration)
		showAction('forward')
		emitSeek(newTime, 'forward')
	}

	const handleBackward15 = () => {
		const currentTime = playerRef.current?.getCurrentTime() || 0
		const newTime = Math.max(currentTime - 15, 0)
		playerRef.current?.seekTo(newTime, 'seconds')
		setPlayed(newTime / duration)
		showAction('backward')
		emitSeek(newTime, 'backward')
	}

	const handlePlay = () => {
		setIsPlaying(true)
		showAction('play')
		const currentTime = playerRef.current?.getCurrentTime() || 0
		emitPlay(currentTime)
	}

	const handlePause = () => {
		setIsPlaying(false)
		showAction('pause')
		const currentTime = playerRef.current?.getCurrentTime() || 0
		emitPause(currentTime)
	}

	const handleVolumeChange = (newVolume: number) => {
		if (newVolume === 0) {
			setMuted(true)
			setMutedBySlider(true)
			setVolume(0)
		} else {
			setVolume(newVolume)
			if (muted) {
				setMuted(false)
				setMutedBySlider(false)
			}
		}
		if (newVolume > 0) {
			previousVolumeRef.current = newVolume
		}
	}

	const handleToggleMuted = () => {
		setMuted(prevMuted => {
			const newMutedState = !prevMuted
			if (localStream) {
				localStream.getAudioTracks().forEach(track => {
					track.enabled = !newMutedState
				})
			}
			if (prevMuted) {
				if (mutedBySlider) {
					setVolume(0.5)
					setMutedBySlider(false)
				} else {
					setVolume(previousVolumeRef.current > 0 ? previousVolumeRef.current : 0.5)
				}
				showAction('unmute')
				return false
			} else {
				previousVolumeRef.current = volume
				showAction('mute')
				return true
			}
		})
	}

	const handleProgress = (state: {
		played: number
		loaded: number
		playedSeconds: number
		loadedSeconds: number
	}) => {
		if (!isDragging) {
			setPlayed(state.played)
			setLoaded(state.loaded)
		}
		if (state.loadedSeconds > 0 && duration === 300) {
			setDuration(playerRef.current?.getDuration() || 300)
		}
	}

	const handleSeekChange = (value: number[]) => {
		const newTime = value[0]
		setPlayed(newTime / duration)
	}

	const handleSeekStart = () => {
		setIsDragging(true)
		setShowControls(true)
		if (controlsTimeoutRef.current) {
			clearTimeout(controlsTimeoutRef.current)
		}
	}

	const handleSeekEnd = () => {
		setIsDragging(false)
		const newTime = played * duration
		const currentTime = playerRef.current?.getCurrentTime() || 0
		const direction = newTime > currentTime ? 'forward' : 'backward'
		playerRef.current?.seekTo(newTime)
		emitSeek(newTime, direction)
		showControlsHandler()
	}

	const showControlsHandler = useCallback(() => {
		setShowControls(true)
		if (controlsTimeoutRef.current) {
			clearTimeout(controlsTimeoutRef.current)
		}
		if (!isDragging) {
			controlsTimeoutRef.current = setTimeout(() => {
				setShowControls(false)
			}, 3000)
		}
	}, [isDragging])

	const handleFullscreenToggle = () => {
		if (!document.fullscreenElement) {
			playerWrapperRef.current?.requestFullscreen()
			setIsFullscreen(true)
		} else if (document.exitFullscreen) {
			document.exitFullscreen()
			setIsFullscreen(false)
		}
	}

	useEffect(() => {
		const handleMouseMove = () => {
			showControlsHandler()
		}

		document.addEventListener('mousemove', handleMouseMove)

		return () => {
			document.removeEventListener('mousemove', handleMouseMove)
			if (controlsTimeoutRef.current) {
				clearTimeout(controlsTimeoutRef.current)
			}
		}
	}, [showControlsHandler])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.code === 'Space') {
				e.preventDefault()
				setIsPlaying(prev => {
					const newState = !prev
					showAction(newState ? 'play' : 'pause')
					const currentTime = playerRef.current?.getCurrentTime() || 0
					if (newState) {
						emitPlay(currentTime)
					} else {
						emitPause(currentTime)
					}
					return newState
				})
			} else if (e.code === 'ArrowRight') {
				handleForward15()
			} else if (e.code === 'ArrowLeft') {
				handleBackward15()
			} else if (e.code === 'KeyM') {
				handleToggleMuted()
			} else if (e.code === 'ArrowUp') {
				e.preventDefault()
				const newVolume = Math.min(volume + 0.1, 1)
				handleVolumeChange(newVolume)
				showAction('volume')
			} else if (e.code === 'ArrowDown') {
				e.preventDefault()
				const newVolume = Math.max(volume - 0.1, 0)
				handleVolumeChange(newVolume)
				showAction('volume')
			}
		}

		document.addEventListener('keydown', handleKeyDown)

		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [volume, handleVolumeChange, emitPause, emitPlay, handleForward15, handleBackward15]) // Added handleBackward15 and handleForward15 to dependencies

	useEffect(() => {
		if (roomID) {
			sessionStorage.setItem('roomID', roomID)
		}
	}, [roomID])

	useEffect(() => {
		if (!localStream) {
			reinitializeStream()
		}
	}, [localStream, reinitializeStream])

	useEffect(() => {
		requestSync()
	}, [requestSync])

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement)
		}

		document.addEventListener('fullscreenchange', handleFullscreenChange)

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange)
		}
	}, [])

	useEffect(() => {
		const updateVideoSize = () => {
			if (playerRef.current) {
				const playerElement = playerRef.current.getInternalPlayer()
				if (playerElement) {
					if (isMovieMode) {
						playerElement.style.width = '100vw'
						playerElement.style.height = '100vh'
						playerElement.style.objectFit = 'cover'
					} else {
						playerElement.style.width = '100%'
						playerElement.style.height = '100%'
						playerElement.style.objectFit = 'contain'
					}
				}
			}
		}

		updateVideoSize()
		window.addEventListener('resize', updateVideoSize)

		return () => {
			window.removeEventListener('resize', updateVideoSize)
		}
	}, [isMovieMode])

	const formatTime = (seconds: number) => {
		const date = new Date(seconds * 1000)
		const hh = date.getUTCHours()
		const mm = date.getUTCMinutes()
		const ss = date.getUTCSeconds().toString().padStart(2, '0')
		if (hh) {
			return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`
		}
		return `${mm}:${ss}`
	}

	const getSpeakerIcon = () => {
		if (muted || volume === 0) return <SpeakerOffIcon />
		if (volume < 0.25) return <SpeakerQuietIcon />
		if (volume < 0.75) return <SpeakerModerateIcon />
		return <SpeakerLoudIcon />
	}

	const handleVolumePointerDown = () => {
		setIsVolumeActive(true)
	}

	const handleVolumePointerUp = () => {
		setIsVolumeActive(false)
	}

	const showAction = (action: 'play' | 'pause' | 'mute' | 'unmute' | 'forward' | 'backward' | 'volume') => {
		setCurrentAction(action)
		setTimeout(() => setCurrentAction(null), 1000)
	}

	const getVolumeIcon = (volume: number) => {
		const IconStyles = {
			color: 'white',
			transform: 'scale(0.5)',
		}

		if (volume === 0) return <SpeakerOffIcon style={IconStyles} />
		if (volume < 0.33) return <SpeakerQuietIcon style={IconStyles} />
		if (volume < 0.66) return <SpeakerModerateIcon style={IconStyles} />
		return <SpeakerLoudIcon style={IconStyles} />
	}

	const handleDragStart = (clientID: string, e: React.DragEvent<HTMLDivElement>) => {
		setDraggingClient(clientID)
		e.dataTransfer.setData('text/plain', clientID)
		const rect = e.currentTarget.getBoundingClientRect()
		const offsetX = e.clientX - rect.left
		const offsetY = e.clientY - rect.top
		e.dataTransfer.setData('application/json', JSON.stringify({ offsetX, offsetY }))

		const dragImage = createDashedSquareDragImage()
		e.dataTransfer.setDragImage(dragImage, 75, 50)
		requestAnimationFrame(() => {
			document.body.removeChild(dragImage)
		})
	}

	const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		const rect = playerWrapperRef.current?.getBoundingClientRect()
		if (rect) {
			const offsetData = e.dataTransfer.getData('application/json')
			const { offsetX, offsetY } = JSON.parse(offsetData)
			const clientID = e.dataTransfer.getData('text/plain')
			const x = Math.max(rect.width - 150, Math.min(e.clientX - rect.left - offsetX, rect.width))
			const y = Math.max(0, Math.min(e.clientY - rect.top - offsetY, rect.height - 100))
			setClientPositions(prev => ({
				...prev,
				[clientID]: { x, y },
			}))
		}
	}

	const handleDragEnd = (clientID: string, e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		setDraggingClient(null)
		const rect = playerWrapperRef.current?.getBoundingClientRect()
		if (rect) {
			const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width - 150))
			const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height - 100))
			setClientPositions(prev => ({
				...prev,
				[clientID]: { x, y },
			}))
		}
	}

	const renderParticipants = () => {
		if (hideUsers === true) return null
		return (
			<div
				style={{
					position: 'absolute',
					top: '0',
					left: '0',
					width: '100%',
					height: '100%',
					pointerEvents: 'none',
					zIndex: 10,
				}}
			>
				{clients.map(clientID => (
					<div
						key={clientID}
						style={{
							width: '150px',
							height: '100px',
							position: 'absolute',
							top: `${clientPositions[clientID]?.y || 10}px`,
							left: `${clientPositions[clientID]?.x || 10}px`,
							pointerEvents: 'auto',
							transition: 'all 0.1s ease-out',
							cursor: 'move',
						}}
						draggable
						onDragStart={e => handleDragStart(clientID, e)}
						onDrag={handleDrag}
						onDragEnd={e => handleDragEnd(clientID, e)}
						onMouseEnter={() => !draggingClient && setHoveredClient(clientID)}
						onMouseLeave={() => !draggingClient && setHoveredClient(null)}
					>
						<video
							width='100%'
							height='100%'
							ref={instance => {
								const videoElement = provideMediaRef(clientID, instance)
								if (videoElement && clientID !== LOCAL_VIDEO) {
									videoElement.then(() => {
										const video = document.querySelector(
											`video[data-client-id="${clientID}"]`
										) as HTMLVideoElement
										if (video) {
											video.volume = clientVolumes[clientID] || 1
										}
									})
								}
							}}
							data-client-id={clientID}
							autoPlay
							playsInline
							muted={clientID === LOCAL_VIDEO}
							style={{
								objectFit: 'cover',
								borderRadius: '5px',
							}}
						/>
						{draggingClient === clientID && (
							<div
								style={{
									position: 'absolute',
									top: '50%',
									left: '50%',
									transform: 'translate(-50%, -50%)',
									padding: '10px',
								}}
							>
								<MoveIcon style={{ color: 'white', transform: 'scale(1)' }} />
							</div>
						)}
						{clientID === LOCAL_VIDEO && cameraMuted && (
							<div
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: '100%',
									backgroundColor: 'black',
									borderRadius: '5px',
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									color: 'white',
									fontSize: '12px',
								}}
							>
								Camera Off
							</div>
						)}
						{hoveredClient === clientID && !draggingClient && (
							<>
								<div
									style={{
										position: 'absolute',
										top: '50%',
										left: '50%',
										transform: 'translate(-50%, -50%)',
										cursor: 'pointer',
									}}
									onClick={() =>
										setCoveredClients(prev => ({ ...prev, [clientID]: !prev[clientID] }))
									}
								>
									<EyeOpenIcon style={{ color: 'white', transform: 'scale(1)' }} />
								</div>
								{clientID !== LOCAL_VIDEO && (
									<div
										style={{
											position: 'absolute',
											bottom: '-5px',
											left: '0px',
											right: '5px',
											display: 'flex',
											alignItems: 'center',
										}}
									>
										<button
											onClick={() => {
												const videoElement = document.querySelector(
													`video[data-client-id="${clientID}"]`
												) as HTMLVideoElement | null

												if (!videoElement) return

												setClientVolumes(prev => {
													const currentVolume = prev[clientID] ?? 1.0
													const isMuted = currentVolume === 0.0

													const newVolume = isMuted ? previousVolumes[clientID] ?? 1.0 : 0.0

													if (!isMuted) {
														setPreviousVolumes(pv => ({ ...pv, [clientID]: currentVolume }))
													}

													videoElement.muted = newVolume === 0.0
													videoElement.volume = newVolume

													return { ...prev, [clientID]: newVolume }
												})
											}}
											style={{
												background: 'none',
												border: 'none',
												cursor: 'pointer',
												padding: 0,
												display: 'flex',
												alignItems: 'center',
											}}
										>
											{getVolumeIcon(clientVolumes[clientID])}
										</button>

										{clientVolumes[clientID] !== 0 && (
											<Slider
												orientation='horizontal'
												min={0.0}
												max={1.0}
												step={0.01}
												value={[clientVolumes[clientID] ?? 1.0]}
												onValueChange={value => {
													const newVolume = value[0] === 0.01 ? 0.0 : value[0]
													console.log(clientID, newVolume)
													setClientVolumes(prev => ({ ...prev, [clientID]: newVolume }))
													const videoElement = document.querySelector(
														`video[data-client-id="${clientID}"]`
													) as HTMLVideoElement
													if (videoElement) {
														videoElement.volume = newVolume
													}
													if (newVolume === 0) {
														videoElement.muted = true
													}
												}}
												style={
													{
														width: '100%',
														marginLeft: '5px',
														'--slider-thumb-size': '10px',
														'--slider-track-height': '2px',
													} as React.CSSProperties
												}
											/>
										)}
									</div>
								)}
							</>
						)}
						{coveredClients[clientID] && (
							<div
								onClick={() => setCoveredClients(prev => ({ ...prev, [clientID]: !prev[clientID] }))}
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: '100%',
									backgroundColor: 'black',
									borderRadius: '5px',
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
								}}
							>
								<EyeClosedIcon style={{ color: 'white', transform: 'scale(1)', cursor: 'pointer' }} />
							</div>
						)}
					</div>
				))}
			</div>
		)
	}

	useEffect(() => {
		const containerWidth = playerWrapperRef.current?.clientWidth || window.innerWidth
		const newPositions: Record<string, { x: number; y: number }> = {}
		clients.forEach((clientID, index) => {
			if (!clientPositions[clientID]) {
				newPositions[clientID] = {
					x: containerWidth - 155 * (index + 1), // 155px is the width of each video container
					y: 10, // 10px from the top
				}
			}
		})
		if (Object.keys(newPositions).length > 0) {
			setClientPositions(prev => ({ ...prev, ...newPositions }))
		}
	}, [clients, clientPositions])

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
				track.enabled = !track.enabled
				setCameraMuted(!track.enabled)
			}
		}
	}

	const handleMovieModeToggle = () => {
		setIsMovieMode(prev => !prev)
	}

	return (
		<div
			ref={playerWrapperRef}
			className={`player-wrapper ${isPlaying ? 'playing' : ''}`}
			onMouseMove={showControlsHandler}
			onMouseLeave={() => !isDragging && setShowControls(false)}
			style={{
				backgroundColor: '#1a1a1a',
				width: '100vw',
				height: '100vh',
				position: 'fixed',
				top: 0,
				left: 0,
				overflow: 'hidden',
			}}
			onDragOver={e => e.preventDefault()}
			onDrop={e => {
				e.preventDefault()
				const clientID = e.dataTransfer.getData('text')
				const rect = playerWrapperRef.current?.getBoundingClientRect()
				if (rect) {
					const x = Math.max(rect.width - 150, Math.min(e.clientX - rect.left, rect.width))
					const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height - 100))
					setClientPositions(prev => ({
						...prev,
						[clientID]: { x, y },
					}))
				}
			}}
		>
			<ReactPlayer
				ref={playerRef}
				className='react-player'
				url='/movie/movie.mkv'
				controls={false}
				playing={isPlaying}
				volume={volume}
				muted={muted}
				onPlay={handlePlay}
				onPause={handlePause}
				onProgress={handleProgress}
				onDuration={duration => setDuration(duration)}
				width='100%'
				height='100%'
				style={{
					backgroundColor: '#1a1a1a',
					objectFit: isMovieMode ? 'cover' : 'contain',
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					zIndex: 1,
				}}
			/>
			{renderParticipants()}
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					pointerEvents: 'none',
					zIndex: 30,
				}}
			>
				<ActionIndicator action={currentAction} volume={volume} />
			</div>
			<div
				className={`controls ${showControls ? 'visible' : 'hidden'}`}
				style={{
					position: 'absolute',
					bottom: '0',
					left: '0',
					right: '0',
					display: 'flex',
					flexDirection: 'column',
					padding: '10px',
					background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
					transition: 'opacity 0.3s ease',
					opacity: showControls ? 1 : 0,
					zIndex: 20,
				}}
			>
				<div
					ref={sliderRef}
					style={{
						margin: '0 0.5rem',
						color: '#fff',
						position: 'relative',
						height: '20px',
						cursor: 'pointer',
					}}
				>
					<Slider
						min={0}
						max={duration}
						step={0.01}
						value={[played * duration]}
						onValueChange={handleSeekChange}
						onPointerDown={handleSeekStart}
						onPointerUp={handleSeekEnd}
						style={
							{
								width: '100%',
								height: '100%',
								'--slider-thumb-size': '12px',
								'--slider-track-height': '4px',
							} as React.CSSProperties
						}
					/>
				</div>

				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '0 0.5rem',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 0 auto' }}>
						<button
							onClick={() =>
								setIsPlaying(prev => {
									const newState = !prev
									if (newState) {
										handlePlay()
									} else {
										handlePause()
									}
									return newState
								})
							}
							style={{
								color: '#fff',
								border: 'none',
								padding: '0.5rem',
								borderRadius: '5px',
								cursor: 'pointer',
								background: 'none',
								display: 'flex',
								alignItems: 'center',
							}}
						>
							{isPlaying ? <PauseIcon /> : <PlayIcon />}
						</button>
						<button
							onClick={handleBackward15}
							style={{
								color: '#fff',
								border: 'none',
								padding: '0.5rem',
								borderRadius: '5px',
								cursor: 'pointer',
								background: 'none',
								display: 'flex',
								alignItems: 'center',
							}}
						>
							<DoubleArrowLeftIcon />
						</button>
						<button
							onClick={handleForward15}
							style={{
								color: '#fff',
								border: 'none',
								padding: '0.5rem',
								borderRadius: '5px',
								cursor: 'pointer',
								background: 'none',
								display: 'flex',
								alignItems: 'center',
							}}
						>
							<DoubleArrowRightIcon />
						</button>
						<div
							style={{
								position: 'relative',
								display: 'flex',
								alignItems: 'center',
							}}
							onMouseEnter={() => setShowVolumeControl(true)}
							onMouseLeave={() => {
								if (!isVolumeActive) {
									setShowVolumeControl(false)
								}
							}}
						>
							<button
								onClick={handleToggleMuted}
								style={{
									color: '#fff',
									border: 'none',
									padding: '0.5rem',
									borderRadius: '5px',
									cursor: 'pointer',
									background: 'none',
									display: 'flex',
									alignItems: 'center',
								}}
							>
								{getSpeakerIcon()}
							</button>
							{!muted && (showVolumeControl || isVolumeActive) && (
								<div
									style={{
										position: 'absolute',
										left: '100%',
										display: 'flex',
										alignItems: 'center',
										height: '100%',
									}}
								>
									<Slider
										orientation='horizontal'
										min={0}
										max={1}
										step={0.01}
										value={[muted ? 0 : volume]}
										onValueChange={value => handleVolumeChange(value[0])}
										onPointerDown={handleVolumePointerDown}
										onPointerUp={handleVolumePointerUp}
										style={
											{
												width: '100px',
												'--slider-thumb-size': isVolumeActive ? '16px' : '12px',
												transition: 'all 0.2s ease',
											} as React.CSSProperties
										}
									/>
								</div>
							)}
						</div>
					</div>

					<div
						style={{
							position: 'absolute',
							left: '50%',
							transform: 'translateX(-50%)',
							color: 'white',
							fontSize: '24px',
							textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
							fontFamily: 'Roboto, sans-serif',
						}}
					>
						{formatTime(played * duration)} / {formatTime(duration)}
					</div>

					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							flex: '1 0 auto',
							justifyContent: 'flex-end',
						}}
					>
						<button
							onClick={handleMicMuteUnmute}
							style={{
								color: micMuted ? '#808080' : '#ffffff',
								border: 'none',
								padding: '0.5rem',
								borderRadius: '5px',
								cursor: 'pointer',
								background: 'none',
								display: 'flex',
								alignItems: 'center',
							}}
						>
							{micMuted ? <FaMicrophoneAltSlash /> : <FaMicrophoneAlt />}
						</button>
						<button
							onClick={handleCameraMuteUnmute}
							style={{
								color: cameraMuted ? '#808080' : '#ffffff',
								border: 'none',
								padding: '0.5rem',
								borderRadius: '5px',
								cursor: 'pointer',
								background: 'none',
								display: 'flex',
								alignItems: 'center',
							}}
						>
							{cameraMuted ? <BsCameraVideoOffFill /> : <BsCameraVideoFill />}
						</button>
						<button
							onClick={handleFullscreenToggle}
							style={{
								color: '#fff',
								border: 'none',
								padding: '0.5rem',
								borderRadius: '5px',
								cursor: 'pointer',
								background: 'none',
								display: 'flex',
								alignItems: 'center',
							}}
						>
							{isFullscreen ? <ExitFullScreenIcon /> : <EnterFullScreenIcon />}
						</button>
						<button
							onClick={handleMovieModeToggle}
							style={{
								color: isMovieMode ? '#808080' : '#ffffff',
								border: 'none',
								padding: '0.5rem',
								borderRadius: '5px',
								cursor: 'pointer',
								background: 'none',
								display: 'flex',
								alignItems: 'center',
							}}
						>
							<SquareIcon />
						</button>
						<button
							onClick={() => {
								if (typeof hideUsers === 'function') {
									setHideUsers(false)
									hideUsers()
								} else {
									setHideUsers(prev => !prev)
								}
							}}
							style={{
								color: hideUsers ? '808080' : '#ffffff',
								border: 'none',
								padding: '0.5rem',
								borderRadius: '5px',
								cursor: 'pointer',
								background: 'none',
								display: 'flex',
								alignItems: 'center',
							}}
						>
							{hideUsers ? <EyeClosedIcon /> : <EyeOpenIcon />}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
