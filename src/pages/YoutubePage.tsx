'use client'

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
	ArrowLeftIcon,
	ChatBubbleIcon,
} from '@radix-ui/react-icons'
import { FaMicrophoneAlt, FaMicrophoneAltSlash } from 'react-icons/fa'
import { BsCameraVideoFill, BsCameraVideoOffFill } from 'react-icons/bs'
import { Slider } from '@radix-ui/themes'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import ActionIndicator from '../components/ActionIndicator'
import { useParams } from 'react-router'
import useWebRTC, { LOCAL_VIDEO } from '../hooks/useWebRTC'
import useRoomSync from '../hooks/useRoomSync'
import { Avatar } from '@radix-ui/themes'
import PrivateChat from './PrivateChat'
import RoomChat from './RoomChat'
import Draggable from 'react-draggable'
import { Resizable, type ResizeCallbackData } from 'react-resizable'
import 'react-resizable/css/styles.css'

// const createDashedSquareDragImage = () => {
// 	const dragImage = document.createElement('div')
// 	dragImage.style.width = '150px'
// 	dragImage.style.height = '100px'
// 	dragImage.style.border = '2px dashed rgba(255, 255, 255, 0.5)'
// 	dragImage.style.padding = '5px'
// 	dragImage.style.boxSizing = 'border-box'
// 	dragImage.style.backgroundColor = 'rgba(0, 0, 0, 0.2)'
// 	dragImage.style.position = 'absolute'
// 	dragImage.style.top = '-1000px'
// 	dragImage.style.left = '-1000px'
// 	dragImage.style.zIndex = '1000'
// 	document.body.appendChild(dragImage)

// 	// Принудительно применяем стили
// 	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
// 	window.getComputedStyle(dragImage).opacity

// 	return dragImage
// }

export default function YoutubePage() {
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
	const [hideUsers, setHideUsers] = useState(false)
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [hoveredItem, setHoveredItem] = useState<string | null>(null)
	const [showUserList, setShowUserList] = useState(false)
	const [highlightedUser, setHighlightedUser] = useState<string | null>(null)
	const [showChat, setShowChat] = useState(false)
	const [chatInput, setChatInput] = useState('')
	const [localUsername, setLocalUsername] = useState('')
	const [avatar, setAvatar] = useState('')
	const [privateChats, setPrivateChats] = useState<Record<string, boolean>>({})
	const [clientSizes, setClientSizes] = useState<Record<string, { width: number; height: number; scale?: number }>>(
		{}
	)
	const [hoveredClientForZoom, setHoveredClientForZoom] = useState<string | null>(null)
	const userListWidth = 250
	const playerRef = useRef<ReactPlayer>(null)
	const controlsTimeoutRef = useRef<number | null>(null)
	const playerWrapperRef = useRef<HTMLDivElement>(null)
	const sliderRef = useRef<HTMLDivElement>(null)
	const previousVolumeRef = useRef(volume)

	const { id: roomID } = useParams<{ id: string }>()
	const {
		clients,
		provideMediaRef,
		localStream,
		reinitializeStream,
		chatMessages,
		sendChatMessage,
		privateMessages,
		sendPrivateMessage,
	} = useWebRTC(roomID!)
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
		requestParticipantInfo,
	} = useRoomSync(roomID!, playerRef, localUsername, avatar)

	useEffect(() => {}, [])

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
	}, [
		volume,
		handleVolumeChange,
		emitPause,
		emitPlay,
		handleForward15,
		handleBackward15,
		handleToggleMuted, // Added handleToggleMuted to dependencies
		muted,
		localStream,
		mutedBySlider,
		previousVolumeRef,
	])

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
		requestParticipantInfo()
	}, [requestParticipantInfo])

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
					<Draggable
						key={clientID}
						defaultPosition={clientPositions[clientID] || { x: 10, y: 10 }}
						bounds='parent'
						onStop={(e, data) => {
							setClientPositions(prev => ({
								...prev,
								[clientID]: { x: data.x, y: data.y },
							}))
						}}
					>
						<Resizable
							width={clientSizes[clientID]?.width || 150}
							height={clientSizes[clientID]?.height || 100}
							onResize={(e, data: ResizeCallbackData) => {
								setClientSizes(prev => ({
									...prev,
									[clientID]: {
										width: data.size.width,
										height: data.size.height,
										scale: prev[clientID]?.scale || 1,
									},
								}))
							}}
							minConstraints={[100, 75]}
							maxConstraints={[300, 200]}
						>
							<div
								style={{
									width: clientSizes[clientID]?.width || 150,
									height: clientSizes[clientID]?.height || 100,
									position: 'absolute',
									pointerEvents: 'auto',
									transition: 'all 0.1s ease-out',
									cursor: 'move',
									display:
										(clientID === LOCAL_VIDEO && cameraMuted) ||
										participantCameras[clientID] === true
											? 'none'
											: 'block',
									border: highlightedUser === clientID ? '3px solid cyan' : 'none',
									boxShadow: highlightedUser === clientID ? '0 0 10px cyan' : 'none',
									transform: `scale(${clientSizes[clientID]?.scale || 1})`,
									transformOrigin: 'center center',
								}}
								onMouseEnter={() => {
									setHoveredClient(clientID)
									setHoveredClientForZoom(clientID)
								}}
								onMouseLeave={() => {
									setHoveredClient(null)
									setHoveredClientForZoom(null)
								}}
								onWheel={e => handleWheel(e, clientID)}
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
								</div>
								{hoveredClient === clientID && (
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

															const newVolume = isMuted
																? previousVolumes[clientID] ?? 1.0
																: 0.0

															if (!isMuted) {
																setPreviousVolumes(pv => ({
																	...pv,
																	[clientID]: currentVolume,
																}))
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
															setClientVolumes(prev => ({
																...prev,
																[clientID]: newVolume,
															}))
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
										onClick={() =>
											setCoveredClients(prev => ({ ...prev, [clientID]: !prev[clientID] }))
										}
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
										<EyeClosedIcon
											style={{ color: 'white', transform: 'scale(1)', cursor: 'pointer' }}
										/>
									</div>
								)}
							</div>
						</Resizable>
					</Draggable>
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
					x: containerWidth - 155 * (index + 1),
					y: 10,
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
			sendChatMessage({ username: localUsername, message: chatInput.trim() })
			setChatInput('')
		}
	}

	useEffect(() => {
		console.log('Fetching avatar...')
		const response = fetch('https://streaming.vladyslavdobrovolskyi.tech/get/emoji/')
		if (response) {
			console.log('Avatar fetched')
			response
				.then(res => res.json())
				.then(data => {
					setAvatar(data.url)
				})
		} else {
			console.log('Failed to fetch avatar')
		}
	}, [])
	useEffect(() => {
		const username = prompt('Please enter your username:')
		if (username) {
			setLocalUsername(username)
		}
	}, [])

	useEffect(() => {
		if (roomID && localUsername) {
			emitInfoSync(localUsername, avatar)
		}
	}, [roomID, localUsername, avatar, emitInfoSync])

	const togglePrivateChat = (clientID: string) => {
		setPrivateChats(prev => ({ ...prev, [clientID]: !prev[clientID] }))
	}
	const closeChat = () => {
		setShowChat(false)
	}

	const handleWheel = (e: React.WheelEvent<HTMLDivElement>, clientID: string) => {
		e.preventDefault()
		if (clientID !== hoveredClientForZoom) return

		const scaleFactor = 0.1
		const newScale =
			e.deltaY > 0
				? (clientSizes[clientID]?.scale || 1) * (1 - scaleFactor)
				: (clientSizes[clientID]?.scale || 1) * (1 + scaleFactor)

		// Limit the scale to a reasonable range (e.g., 0.5 to 2)
		const clampedScale = Math.min(Math.max(newScale, 0.5), 2)

		setClientSizes(prevSizes => ({
			...prevSizes,
			[clientID]: {
				...prevSizes[clientID],
				width: (prevSizes[clientID]?.width || 150) * (clampedScale / (prevSizes[clientID]?.scale || 1)),
				height: (prevSizes[clientID]?.height || 100) * (clampedScale / (prevSizes[clientID]?.scale || 1)),
				scale: clampedScale,
			},
		}))
	}

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
		>
			<ReactPlayer
				ref={playerRef}
				className='react-player'
				url='https://www.youtube.com/watch?v=72xnuwrISL8'
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
						overflowX: 'hidden',
						transition: 'right 0.3s ease-in-out',
					}}
				>
					<h2 style={{ color: 'white', padding: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
						Users
					</h2>
					{clients
						.filter(clientID => clientID !== LOCAL_VIDEO)
						.map(clientID => {
							const username = participantInfo[clientID]?.username || 'Anonymous'
							const displayUsername = username

							return (
								<div
									key={clientID}
									style={{
										padding: '10px',
										borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
										backgroundColor:
											highlightedUser === clientID ? 'rgba(0, 255, 255,0.2)' : 'transparent',
										display: 'flex',
										alignItems: 'center',
										gap: '10px',
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}
									onMouseEnter={() => setHighlightedUser(clientID)}
									onMouseLeave={() => setHighlightedUser(null)}
								>
									<Avatar
										src={clientID === LOCAL_VIDEO ? avatar : participantInfo[clientID]?.avatar}
										fallback='?'
									/>
									<div style={{ position: 'relative', flexGrow: 1 }}>
										<p
											style={{
												color: 'white',
												margin: 0,
												cursor: username.length > 15 ? 'pointer' : 'default',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
												maxWidth: '150px',
											}}
											title={username}
										>
											{displayUsername}
										</p>
									</div>
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
												participantCameras[clientID] ||
												(clientID === LOCAL_VIDEO && cameraMuted)
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
									<button
										onClick={() => togglePrivateChat(clientID)}
										style={{
											background: 'none',
											border: 'none',
											cursor: 'pointer',
											color: 'white',
											padding: '5px',
										}}
									>
										<ChatBubbleIcon />
									</button>
								</div>
							)
						})}
				</div>
			)}
			{showChat && (
				<RoomChat
					clientID={LOCAL_VIDEO}
					messages={chatMessages}
					chatInput={chatInput}
					setChatInput={setChatInput}
					handleSendMessage={handleSendMessage}
					onClose={closeChat}
				/>
			)}
			{Object.entries(privateChats).map(
				([clientID, isOpen]) =>
					isOpen && (
						<PrivateChat
							key={clientID}
							recipientId={clientID}
							recipientName={
								clientID === LOCAL_VIDEO
									? localUsername
									: participantInfo[clientID]?.username || 'Anonymous'
							}
							recipientAvatar={
								clientID === LOCAL_VIDEO ? avatar : participantInfo[clientID]?.avatar || ''
							}
							onClose={() => togglePrivateChat(clientID)}
							sendPrivateMessage={sendPrivateMessage}
							privateMessages={privateMessages[clientID] || []}
						/>
					)
			)}
		</div>
	)
}
