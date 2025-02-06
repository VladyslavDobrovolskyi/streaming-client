// 04.02.2025
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
	DotsHorizontalIcon,
	SectionIcon,
	MoveIcon,
	ArrowLeftIcon,
} from '@radix-ui/react-icons'
import { FaMicrophoneAlt, FaMicrophoneAltSlash } from 'react-icons/fa'
import { BsCameraVideoFill, BsCameraVideoOffFill } from 'react-icons/bs'
import { Slider } from '@radix-ui/themes'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import ActionIndicator from '../components/ActionIndicator'
import { useParams } from 'react-router'
import useWebRTC, { LOCAL_VIDEO } from '../hooks/useWebRTC'
import useRoomSync from '../hooks/useRoomSync'
import ChatComponent from './ChatComponent'

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
	const [hideUsers, setHideUsers] = useState(false) // Updated hideUsers state
	const [isMenuOpen, setIsMenuOpen] = useState(false) // Added isMenuOpen state
	const [hoveredItem, setHoveredItem] = useState<string | null>(null) // Added hoveredItem state
	const [showUserList, setShowUserList] = useState(false) // Added showUserList state
	const [highlightedUser, setHighlightedUser] = useState<string | null>(null)
	const [showChat, setShowChat] = useState(false) // Added showChat state
	const [chatInput, setChatInput] = useState('') // Added chatInput state
	const [localUsername, setLocalUsername] = useState('') // Added localUsername state
	const userListWidth = 250 // Added userListWidth constant
	const playerRef = useRef<ReactPlayer>(null)
	const controlsTimeoutRef = useRef<number | null>(null)
	const playerWrapperRef = useRef<HTMLDivElement>(null)
	const sliderRef = useRef<HTMLDivElement>(null)
	const previousVolumeRef = useRef(volume)

	const { id: roomID } = useParams<{ id: string }>()
	const { clients, provideMediaRef, localStream, reinitializeStream, chatMessages, sendChatMessage } = useWebRTC(
		roomID!
	) // Updated useWebRTC call
	const {
		emitPlay,
		emitPause,
		emitSeek,
		requestSync,
		emitInfoSync,
		emitCameraSync,
		emitMicrophoneSync,
		lastSeekDirection,
		participantInfo,
		participantCameras,
		participantMicrophones,
	} = useRoomSync(roomID!, playerRef)

	useEffect(() => {}, [hideUsers])

	useEffect(() => {
		console.log('Participant info:', participantInfo)
	}, [participantInfo])
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
		const currentTime = playerRef.current?.getCurrentTime() || 0
		const direction = newTime > currentTime ? 'forward' : 'backward'
		emitSeek(newTime, direction)
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
		if (!isDragging && !isMenuOpen) {
			controlsTimeoutRef.current = setTimeout(() => {
				setShowControls(false)
			}, 3000) as unknown as number
		}
	}, [isDragging, isMenuOpen])

	const handleFullscreenToggle = () => {
		if (!document.fullscreenElement) {
			playerWrapperRef.current?.requestFullscreen()
			setIsFullscreen(true)
		} else if (document.exitFullscreen) {
			document.exitFullscreen()
			setIsFullscreen(false)
		}
		setIsMenuOpen(false)
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
		e.dataTransfer.setDragImage(dragImage, offsetX, offsetY)
		requestAnimationFrame(() => {
			document.body.removeChild(dragImage)
		})
	}

	const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		const rect = playerWrapperRef.current?.getBoundingClientRect()
		if (rect) {
			const offsetData = e.dataTransfer.getData('application/json')

			if (offsetData) {
				try {
					const { offsetX, offsetY } = JSON.parse(offsetData)
					const clientID = e.dataTransfer.getData('text/plain')
					const x = Math.max(0, Math.min(e.clientX - rect.left - offsetX, rect.width - 150))
					const y = Math.max(0, Math.min(e.clientY - rect.top - offsetY, rect.height - 100))
					setClientPositions(prev => ({
						...prev,
						[clientID]: { x, y },
					}))
				} catch (error) {
					console.error('Error parsing JSON:', error)
				}
			}
		}
	}

	const handleDragEnd = (clientID: string, e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		setDraggingClient(null)
		const rect = playerWrapperRef.current?.getBoundingClientRect()
		if (rect) {
			const offsetData = e.dataTransfer.getData('application/json')
			if (offsetData) {
				try {
					const { offsetX, offsetY } = JSON.parse(offsetData)
					const x = Math.max(0, Math.min(e.clientX - rect.left - offsetX, rect.width - 150))
					const y = Math.max(0, Math.min(e.clientY - rect.top - offsetY, rect.height - 100))
					setClientPositions(prev => ({
						...prev,
						[clientID]: { x, y },
					}))
				} catch (error) {
					console.error('Error parsing JSON:', error)
				}
			}
		}
	}

	const renderParticipants = () => {
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
					opacity: hideUsers ? 0 : 1,
					visibility: hideUsers ? 'hidden' : 'visible',
					transition: 'opacity 0.3s ease, visibility 0.3s ease',
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
							display:
								(clientID === LOCAL_VIDEO && cameraMuted) || participantCameras[clientID] === true
									? 'none'
									: 'block',
							border: highlightedUser === clientID ? '3px solid cyan' : 'none',
							boxShadow: highlightedUser === clientID ? '0 0 10px cyan' : 'none',
						}}
						draggable
						onDragStart={e => handleDragStart(clientID, e)}
						onDrag={handleDrag}
						onDragEnd={e => handleDragEnd(clientID, e)}
						onMouseEnter={() => !draggingClient && setHoveredClient(clientID)}
						onMouseLeave={() => !draggingClient && setHoveredClient(null)}
					>
						<div
							style={{
								width: '100%',
								height: '100%',
								position: 'relative',
							}}
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
										pointerEvents: 'none',
									}}
								>
									<MoveIcon style={{ color: 'white', transform: 'scale(0.75)' }} />
								</div>
							)}
						</div>
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
														cursor: 'pointer',
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
				const newMutedState = !micMuted
				track.enabled = !newMutedState
				setMicMuted(newMutedState)
				emitMicrophoneSync(newMutedState)
			} else {
				console.warn('No audio tracks found in the local stream')
			}
		} else {
			console.error('Local stream is not available')
		}
	}

	const handleCameraMuteUnmute = () => {
		if (localStream) {
			const videoTracks = localStream.getVideoTracks()
			if (videoTracks.length > 0) {
				const track = videoTracks[0]
				track.enabled = !track.enabled
				setCameraMuted(!track.enabled)
				emitCameraSync(!track.enabled)
			} else {
				console.warn('No video tracks found in the local stream')
			}
		} else {
			console.error('Local stream is not available')
		}
	}

	const handleMovieModeToggle = () => {
		setIsMovieMode(prev => !prev)
	}

	const handleMenuOpen = () => {
		setIsMenuOpen(true)
	}

	const handleMenuClose = () => {
		setIsMenuOpen(false)
	}

	const toggleUserList = () => {
		setShowUserList(prev => !prev)
	}

	useEffect(() => {
		if (localStream) {
			const audioTrack = localStream.getAudioTracks()[0]
			if (audioTrack) {
				setMicMuted(!audioTrack.enabled)
			}
		}
	}, [localStream])

	const handleSendMessage = () => {
		if (chatInput.trim()) {
			sendChatMessage(chatInput.trim())
			setChatInput('')
		}
	}

	useEffect(() => {
		const username = prompt('Please enter your username:')
		if (username) {
			setLocalUsername(username)
		}
	}, [])

	useEffect(() => {
		if (roomID && localUsername) {
			emitInfoSync(localUsername)
		}
	}, [roomID, localUsername, emitInfoSync])

	return (
		<div
			ref={playerWrapperRef}
			className={`player-wrapper ${isPlaying ? 'playing' : ''}`}
			onMouseMove={showControlsHandler}
			onMouseLeave={() => {
				if (!isDragging && !isMenuOpen) {
					setShowControls(false)
				}
			}}
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
				const clientID = e.dataTransfer.getData('text/plain')
				const offsetData = e.dataTransfer.getData('application/json')

				if (offsetData) {
					try {
						const { offsetX, offsetY } = JSON.parse(offsetData)
						const rect = playerWrapperRef.current?.getBoundingClientRect()
						if (rect) {
							const x = Math.max(0, Math.min(e.clientX - rect.left - offsetX, rect.width - 150))
							const y = Math.max(0, Math.min(e.clientY - rect.top - offsetY, rect.height - 100))
							setClientPositions(prev => ({
								...prev,
								[clientID]: { x, y },
							}))
						}
					} catch (error) {
						console.error('Error parsing JSON:', error)
					}
				}
			}}
		>
			<ReactPlayer
				ref={playerRef}
				className='react-player'
				url='/music/beat.mp4'
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
						color: 'white',
						position: 'relative',
						height: '20px',
						cursor: 'pointer',
					}}
				>
					<Slider
						min={0}
						max={duration}
						step={0.01}
						value={[played * duration || 0]}
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
								color: 'white',
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
								color: 'white',
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
								color: 'white',
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
									color: 'white',
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
						<DropdownMenu.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
							<DropdownMenu.Trigger asChild>
								<button
									onClick={handleMenuOpen}
									style={{
										color: 'white',
										border: 'none',
										padding: '0.5rem',
										borderRadius: '5px',
										cursor: 'pointer',
										background: 'none',
										display: 'flex',
										alignItems: 'center',
									}}
								>
									<DotsHorizontalIcon />
								</button>
							</DropdownMenu.Trigger>{' '}
							{isMenuOpen && (
								<div
									style={{
										position: 'fixed',
										bottom: showControls ? '60px' : '10px',
										right: '10px',
										zIndex: 9999,
										minWidth: 220,
										transition: 'bottom 0.3s ease',
									}}
								>
									<DropdownMenu.Content
										onMouseEnter={() => {
											setShowControls(true)
											if (controlsTimeoutRef.current) {
												clearTimeout(controlsTimeoutRef.current)
											}
										}}
										onMouseLeave={handleMenuClose}
										style={{
											backgroundColor: 'rgba(0, 0, 0, 0.8)',
											borderRadius: '4px',
											padding: '4px',
											zIndex: 9999,
										}}
									>
										<DropdownMenu.Item
											onSelect={event => {
												event.preventDefault()
												handleMicMuteUnmute()
											}}
											onMouseEnter={() => setHoveredItem('mic')}
											onMouseLeave={() => setHoveredItem(null)}
											style={{
												padding: '8px 12px',
												cursor: 'pointer',
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												backgroundColor:
													hoveredItem === 'mic' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
												color: 'white',
												border: 'none',
												width: '100%',
												textAlign: 'left',
												outline: 'none',
											}}
										>
											{micMuted ? <FaMicrophoneAltSlash /> : <FaMicrophoneAlt />}
											{micMuted ? 'Unmute Microphone' : 'Mute Microphone'}
										</DropdownMenu.Item>
										<DropdownMenu.Item
											onSelect={event => {
												event.preventDefault()
												handleCameraMuteUnmute()
											}}
											onMouseEnter={() => setHoveredItem('camera')}
											onMouseLeave={() => setHoveredItem(null)}
											style={{
												padding: '8px 12px',
												cursor: 'pointer',
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												backgroundColor:
													hoveredItem === 'camera'
														? 'rgba(255, 255, 255, 0.1)'
														: 'transparent',
												color: 'white',
												border: 'none',
												width: '100%',
												textAlign: 'left',
												outline: 'none',
											}}
										>
											{cameraMuted ? <BsCameraVideoOffFill /> : <BsCameraVideoFill />}
											{cameraMuted ? 'Turn Camera On' : 'Turn Camera Off'}
										</DropdownMenu.Item>
										<DropdownMenu.Item
											onSelect={event => {
												event.preventDefault()
												handleMovieModeToggle()
											}}
											onMouseEnter={() => setHoveredItem('movieMode')}
											onMouseLeave={() => setHoveredItem(null)}
											style={{
												padding: '8px 12px',
												cursor: 'pointer',
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												backgroundColor:
													hoveredItem === 'movieMode'
														? 'rgba(255, 255, 255, 0.1)'
														: 'transparent',
												color: 'white',
												border: 'none',
												width: '100%',
												textAlign: 'left',
												outline: 'none',
											}}
										>
											{isMovieMode ? <SectionIcon /> : <SquareIcon />}
											{isMovieMode ? 'Disable Movie Mode' : 'Enable Movie Mode'}
										</DropdownMenu.Item>
										<DropdownMenu.Item
											onSelect={event => {
												event.preventDefault()
												setHideUsers(prev => !prev)
											}}
											onMouseEnter={() => setHoveredItem('hideUsers')}
											onMouseLeave={() => setHoveredItem(null)}
											style={{
												padding: '8px 12px',
												cursor: 'pointer',
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												backgroundColor:
													hoveredItem === 'hideUsers'
														? 'rgba(255, 255, 255, 0.1)'
														: 'transparent',
												color: 'white',
												border: 'none',
												width: '100%',
												textAlign: 'left',
												outline: 'none',
											}}
										>
											{hideUsers ? <EyeOpenIcon /> : <EyeClosedIcon />}
											{hideUsers ? 'Show Users' : 'Hide Users'}
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</div>
							)}
						</DropdownMenu.Root>
						<button
							onClick={handleFullscreenToggle}
							style={{
								color: 'white',
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
					</div>
				</div>
				<button
					onClick={() => setShowChat(prev => !prev)}
					style={{
						color: 'white',
						border: 'none',
						padding: '0.5rem',
						borderRadius: '5px',
						cursor: 'pointer',
						background: 'none',
						display: 'flex',
						alignItems: 'center',
					}}
				>
					{showChat ? 'Hide Chat' : 'Show Chat'}
				</button>
			</div>
			<div
				style={{
					position: 'absolute',
					top: '50%',
					right: showUserList ? userListWidth : 0,
					transform: 'translateY(-50%)',
					zIndex: 30,
					transition: 'right 0.3s ease-in-out',
				}}
			>
				<button
					onClick={toggleUserList}
					style={{
						background: 'rgba(0, 0, 0, 0.5)',
						border: 'none',
						borderRadius: '50% 0 0 50%',
						padding: '10px',
						cursor: 'pointer',
					}}
				>
					<ArrowLeftIcon style={{ color: 'white', transform: `rotate(${showUserList ? 180 : 0}deg)` }} />
				</button>
			</div>

			{showUserList && (
				<div
					style={{
						position: 'absolute',
						top: 0,
						right: 0,
						width: `${userListWidth}px`,
						height: '100%',
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						zIndex: 25,
						overflowY: 'auto',
						transition: 'right 0.3s ease-in-out',
					}}
				>
					<h2 style={{ color: 'white', padding: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
						Users
					</h2>
					{clients.map(clientID => (
						<div
							key={clientID}
							style={{
								padding: '10px',
								borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
								backgroundColor: highlightedUser === clientID ? 'rgba(0, 255, 255,0.2)' : 'transparent',
							}}
							onMouseEnter={() => setHighlightedUser(clientID)}
							onMouseLeave={() => setHighlightedUser(null)}
						>
							<p style={{ color: 'white', marginBottom: '5px' }}>
								{participantInfo[clientID]?.username || 'Anonymous'}
							</p>
							<div style={{ display: 'flex', gap: '10px' }}>
								<span
									style={{
										color:
											clientID === LOCAL_VIDEO
												? micMuted
													? 'red'
													: 'green'
												: participantMicrophones[clientID]
												? 'red'
												: 'green',
									}}
								>
									{clientID === LOCAL_VIDEO ? (
										micMuted ? (
											<FaMicrophoneAltSlash />
										) : (
											<FaMicrophoneAlt />
										)
									) : participantMicrophones[clientID] ? (
										<FaMicrophoneAltSlash />
									) : (
										<FaMicrophoneAlt />
									)}
								</span>
								<span
									style={{
										color:
											participantCameras[clientID] || (clientID === LOCAL_VIDEO && cameraMuted)
												? 'red'
												: 'green',
									}}
								>
									{participantCameras[clientID] || (clientID === LOCAL_VIDEO && cameraMuted) ? (
										<BsCameraVideoOffFill />
									) : (
										<BsCameraVideoFill />
									)}
								</span>
							</div>
						</div>
					))}
				</div>
			)}
			{showChat && (
				<div
					style={{
						position: 'absolute',
						bottom: 60,
						right: 10,
						width: 300,
						height: 400,
						zIndex: 40,
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						borderRadius: '8px',
						overflow: 'hidden',
					}}
				>
					<ChatComponent
						clientID={LOCAL_VIDEO}
						messages={chatMessages}
						chatInput={chatInput}
						setChatInput={setChatInput}
						handleSendMessage={handleSendMessage}
					/>
				</div>
			)}
		</div>
	)
}
