'use client'

// 10.02.2025
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
import * as Toast from '@radix-ui/react-toast'
import ActionIndicator from '../components/ActionIndicator'
import { useParams } from 'react-router'
import useWebRTC, { LOCAL_VIDEO } from '../hooks/useWebRTC'
import useRoomSync from '../hooks/useRoomSync'
import { Avatar } from '@radix-ui/themes'
import PrivateChat from './PrivateChat'
import RoomChat from './RoomChat'
import 'react-resizable/css/styles.css'
import ClientVideo from './ClientVideo'
import { styled, keyframes } from '@stitches/react'
import useLocalStorageSync from '../hooks/useLocalStorageSync'
import { Badge } from '@radix-ui/themes'

interface UserPosition {
	x: number
	y: number
}

const slideIn = keyframes({
	from: { transform: `translateX(calc(100% + 1rem))` },
	to: { transform: 'translateX(0)' },
})

const StyledToastViewport = styled(Toast.Viewport, {
	position: 'fixed',
	bottom: 0,
	right: 0,
	display: 'flex',
	flexDirection: 'column',
	padding: '1rem',
	gap: '0.5rem',
	width: '390px',
	maxWidth: '100vw',
	margin: 0,
	listStyle: 'none',
	zIndex: 2147483647,
})

const StyledToastRoot = styled(Toast.Root, {
	backgroundColor: 'white',
	borderRadius: '0.5rem',
	boxShadow: 'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px',
	padding: '0.75rem',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'flex-start',
	gap: '0.5rem',
	animation: `${slideIn} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
})

const StyledToastTitle = styled(Toast.Title, {
	fontWeight: 500,
	color: 'black',
	fontSize: '1rem',
})

const StyledToastDescription = styled(Toast.Description, {
	color: 'gray',
	fontSize: '0.875rem',
})

const StyledToastClose = styled(Toast.Close, {
	position: 'absolute',
	top: '0.5rem',
	right: '0.5rem',
	background: 'none',
	border: 'none',
	cursor: 'pointer',
	color: 'gray',
	'&:hover': {
		color: 'black',
	},
})

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

export default function RoomDev() {
	const [toasts, setToasts] = useState<Array<{ id: string; avatar: string; title: string; description: string }>>([])
	const { id: roomID } = useParams<{ id: string }>()
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
	const {
		clients,
		provideMediaRef,
		localStream,
		localPeerId,
		reinitializeStream,
		chatMessages,
		sendChatMessage,
		privateMessages,
		setPrivateMessages,
		sendPrivateMessage,
		initialCameraDisabledState,
		initialMicrophoneDisabledState,
	} = useWebRTC(roomID!)
	const [isCameraDisabled, setCameraMuted] = useState(initialCameraDisabledState)
	const [isMicrophoneDisabled, setMicMuted] = useState(initialMicrophoneDisabledState)
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
	const [clientVolumes, setClientVolumes] = useState<Record<string, number>>({})
	const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({})
	const userListWidth = 380
	const playerRef = useRef<ReactPlayer>(null)
	const controlsTimeoutRef = useRef<number | null>(null)
	const playerWrapperRef = useRef<HTMLDivElement>(null)
	const sliderRef = useRef<HTMLDivElement>(null)
	const previousVolumeRef = useRef(volume)
	const { userData, updateUserPosition, updateUserStatus, updateUserVolume } = useLocalStorageSync(roomID!)

	const addToast = (avatar: string, title: string, description: string) => {
		const id = Math.random().toString(36).substr(2, 9)
		setToasts(prev => [...prev, { id, avatar, title, description }])
	}
	const {
		emitPlay,
		emitPause,
		emitSeek,
		requestSync,
		emitInfoSync,
		// emitCameraSync,
		// emitMicrophoneSync,
		setLastSeekDirection,
		lastSeekDirection,
		participantInfo,
		setParticipantInfo,
		// participantCameras,
		// participantMicrophones,
		requestParticipantInfo,
	} = useRoomSync(roomID!, playerRef, localUsername, avatar, isCameraDisabled, isMicrophoneDisabled, addToast)

	useEffect(() => {
		console.log('Toasts:', toasts)
	}, [toasts])

	useEffect(() => {
		setParticipantInfo(prev => ({
			...prev,
			[localPeerId]: {
				username: localUsername,
				avatar,
				isCameraDisabled,
				isMicrophoneDisabled,
			},
		}))
	}, [localUsername, avatar, isCameraDisabled, isMicrophoneDisabled, setParticipantInfo, localPeerId])

	useEffect(() => {
		console.log('Participants:', clients, 'Participant info: ', participantInfo)
	}, [clients, participantInfo])

	useEffect(() => {
		console.log('Loaded:', loaded)
		console.log(
			`[ Initial Microphone and camera states: ${initialMicrophoneDisabledState}`,
			initialCameraDisabledState
		)
		setMicMuted(initialMicrophoneDisabledState)
		setCameraMuted(initialCameraDisabledState)
	}, [loaded, initialCameraDisabledState, initialMicrophoneDisabledState])

	useEffect(() => {
		if (lastSeekDirection) {
			showAction(lastSeekDirection)
			setLastSeekDirection(null)
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
		if (!isPlaying) {
			setIsPlaying(true)
			showAction('play')
			const currentTime = playerRef.current?.getCurrentTime() || 0
			emitPlay(currentTime)
		}
	}

	const handlePause = () => {
		setIsPlaying(false)
		showAction('pause')
		const currentTime = playerRef.current?.getCurrentTime() || 0
		emitPause(currentTime)
	}

	useEffect(() => {
		if (isPlaying) showAction('play')
		if (!isPlaying) showAction('pause')
	}, [isPlaying])

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
				if (!isPlaying) {
					handlePlay()
				} else {
					handlePause()
				}
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
	})

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
				{clients.map((clientID, index) => {
					const participantData = participantInfo[clientID] || {}
					const isCameraMuted = clientID === LOCAL_VIDEO ? isCameraDisabled : participantData.isCameraDisabled

					return (
						<ClientVideo
							key={clientID}
							clientID={clientID}
							provideMediaRef={provideMediaRef}
							isLocal={clientID === LOCAL_VIDEO}
							username={participantData.username || 'Anonymous'}
							isCameraMuted={isCameraMuted}
							isMicrophoneMuted={
								clientID === LOCAL_VIDEO ? isMicrophoneDisabled : participantData.isMicrophoneDisabled
							}
							position={clientPositions[clientID] || { x: 0, y: 0 + index * 110 }}
							size={clientSizes[clientID] || { width: 150, height: 100 }}
							onPositionChange={(id, pos) => {
								setClientPositions(prev => ({ ...prev, [id]: pos }))
								updateUserPosition(id, pos)
							}}
							onSizeChange={(id, size) => setClientSizes(prev => ({ ...prev, [id]: size }))}
							onVolumeChange={(id, vol) => {
								setClientVolumes(prev => ({ ...prev, [id]: vol }))
								updateUserVolume(id, vol)
								const videoElement = document.querySelector(
									`video[data-client-id="${id}"]`
								) as HTMLVideoElement
								if (videoElement) {
									videoElement.volume = vol
									videoElement.muted = vol === 0
								}
							}}
							onCoverToggle={id => setCoveredClients(prev => ({ ...prev, [id]: !prev[id] }))}
							isCovered={coveredClients[clientID]}
							volume={clientVolumes[clientID] || 1}
							highlightedUser={highlightedUser}
						/>
					)
				})}
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
			const audioTrack = localStream.getAudioTracks()[0]
			console.log('Before Toggle Audio Track:', audioTrack)
			try {
				if (audioTrack.enabled) {
					audioTrack.enabled = false
					setMicMuted(true)
					emitInfoSync(localUsername, avatar, isCameraDisabled, true)
					updateUserStatus(LOCAL_VIDEO, { isCameraDisabled, isMicrophoneDisabled: true })
				} else {
					audioTrack.enabled = true
					setMicMuted(false)
					emitInfoSync(localUsername, avatar, isCameraDisabled, false)
					updateUserStatus(LOCAL_VIDEO, { isCameraDisabled, isMicrophoneDisabled: false })
				}
			} finally {
				console.log('After Toggle Audio Track:', audioTrack)
			}
		}
	}

	const handleCameraMuteUnmute = () => {
		if (localStream) {
			const videoTrack = localStream.getVideoTracks()[0]
			console.log('Before Toggle Audio Track:', videoTrack)
			try {
				if (videoTrack.enabled) {
					videoTrack.enabled = false
					setCameraMuted(true)
					emitInfoSync(localUsername, avatar, true, isMicrophoneDisabled)
					updateUserStatus(LOCAL_VIDEO, { isCameraDisabled: true, isMicrophoneDisabled })
				} else {
					videoTrack.enabled = true
					setCameraMuted(false)
					emitInfoSync(localUsername, avatar, false, isMicrophoneDisabled)
					updateUserStatus(LOCAL_VIDEO, { isCameraDisabled: false, isMicrophoneDisabled })
				}
			} finally {
				console.log('After Toggle Video Track:', videoTrack)
			}
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

	// useEffect(() => {
	// 	if (localStream) {
	// 		const audioTrack = localStream.getAudioTracks()[0]
	// 		if (audioTrack) {
	// 			setMicMuted(!audioTrack.enabled)
	// 		}
	// 	}
	// }, [localStream])

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
		console.log('Initial states:', initialMicrophoneDisabledState, initialCameraDisabledState)
	}, [initialMicrophoneDisabledState, initialCameraDisabledState])

	useEffect(() => {
		if (roomID && localUsername) {
			console.log('Emitting info sync...', `Camera and mic: ${isCameraDisabled} | ${isMicrophoneDisabled}`)
			emitInfoSync(localUsername, avatar, isCameraDisabled, isMicrophoneDisabled)
		}
	}, [roomID, localUsername, avatar, emitInfoSync, isCameraDisabled, isMicrophoneDisabled])

	useEffect(() => {
		const newUnreadMessages: Record<string, number> = {}
		Object.entries(privateMessages).forEach(([clientID, messages]) => {
			if (privateChats[clientID]) {
				setUnreadMessages(prev => ({ ...prev, [clientID]: 0 }))
			} else {
				if (clientID !== localPeerId) {
					newUnreadMessages[clientID] = messages.filter(msg => !msg.read && msg.from !== localPeerId).length
					setUnreadMessages(newUnreadMessages)
				}
			}
		})
	}, [privateMessages, localPeerId, privateChats])

	const togglePrivateChat = (clientID: string) => {
		setPrivateChats(prev => {
			const newState = { ...prev, [clientID]: !prev[clientID] }
			if (newState[clientID]) {
				// Mark messages as read when opening the chat
				setPrivateMessages(prev => {
					const updatedMessages = { ...prev }
					if (updatedMessages[clientID]) {
						updatedMessages[clientID] = updatedMessages[clientID].map(msg => ({
							...msg,
							read: true,
						}))
					}
					return updatedMessages
				})
				setUnreadMessages(prev => ({ ...prev, [clientID]: 0 }))
			}
			return newState
		})
	}
	const closeChat = () => {
		setShowChat(false)
	}

	useEffect(() => {
		const storedPositions = Object.entries(userData).reduce((acc, [clientId, data]) => {
			if (data.position) {
				acc[clientId] = data.position
			}
			return acc
		}, {} as Record<string, UserPosition>)

		setClientPositions(prev => ({ ...prev, ...storedPositions }))

		const storedVolumes = Object.entries(userData).reduce((acc, [clientId, data]) => {
			if (data.volume !== undefined) {
				acc[clientId] = data.volume
			}
			return acc
		}, {} as Record<string, number>)

		setClientVolumes(prev => ({ ...prev, ...storedVolumes }))
	}, [userData])

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
				url='/music/beat.mp4'
				controls={false}
				playing={isPlaying}
				volume={volume}
				muted={muted}
				onPlay={() => setIsPlaying(true)}
				onPause={() => setIsPlaying(false)}
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
						style={{
							width: '100%',
							height: '100%',
						}}
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
							onClick={() => {
								if (isPlaying) {
									handlePause()
								} else {
									handlePlay()
								}
							}}
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
										style={{
											width: '100px',
											transition: 'all 0.2s ease',
										}}
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
											{isMicrophoneDisabled ? <FaMicrophoneAltSlash /> : <FaMicrophoneAlt />}
											{isMicrophoneDisabled ? 'Unmute Microphone' : 'Mute Microphone'}
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
											{isCameraDisabled ? <BsCameraVideoOffFill /> : <BsCameraVideoFill />}
											{isCameraDisabled ? 'Turn Camera On' : 'Turn Camera Off'}
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
											{hideUsers ? 'ShowUsers' : 'Hide Users'}
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
					{Object.keys(participantInfo).length === 0 && (
						<div style={{ padding: '10px', color: 'white', textAlign: 'center' }}>
							<p>No other participants are currently in the room.</p>
						</div>
					)}
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
													? isMicrophoneDisabled
														? 'red'
														: 'green'
													: participantInfo[clientID].isMicrophoneDisabled
													? 'red'
													: 'green',
										}}
									>
										{clientID === LOCAL_VIDEO ? (
											isMicrophoneDisabled ? (
												<FaMicrophoneAltSlash />
											) : (
												<FaMicrophoneAlt />
											)
										) : participantInfo[clientID].isMicrophoneDisabled ? (
											<FaMicrophoneAltSlash />
										) : (
											<FaMicrophoneAlt />
										)}
									</span>
									<span
										style={{
											color:
												participantInfo[clientID].isCameraDisabled ||
												(clientID === LOCAL_VIDEO && isCameraDisabled)
													? 'red'
													: 'green',
										}}
									>
										{participantInfo[clientID].isCameraDisabled ||
										(clientID === LOCAL_VIDEO && isCameraDisabled) ? (
											<BsCameraVideoOffFill />
										) : (
											<BsCameraVideoFill />
										)}
									</span>
									<div style={{ display: 'flex', alignItems: 'center' }}>
										<button
											onClick={() => togglePrivateChat(clientID)}
											style={{
												background: 'none',
												border: 'none',
												cursor: 'pointer',
												color: 'white',
												padding: '5px',
												position: 'relative',
											}}
										>
											<ChatBubbleIcon />
											{unreadMessages[clientID] > 0 && (
												<Badge
													style={{
														position: 'absolute',
														top: '-5px',
														right: '-5px',
														fontSize: '0.7rem',
														padding: '2px 4px',
													}}
												>
													{unreadMessages[clientID]}
												</Badge>
											)}
										</button>
									</div>
								</div>
							)
						})}
				</div>
			)}
			{showChat && (
				<RoomChat
					onOpenPrivateChat={togglePrivateChat}
					realClientID={localPeerId}
					participantInfo={participantInfo}
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
							onMouseEnter={() => setHighlightedUser(clientID)}
							onMouseLeave={() => setHighlightedUser(null)}
							key={clientID}
							recipientId={clientID}
							realClientID={localPeerId}
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
			<Toast.Provider swipeDirection='right'>
				{toasts.map(toast => (
					<StyledToastRoot key={toast.id} duration={3000}>
						<StyledToastTitle>
							{toast.avatar && <Avatar src={toast.avatar} fallback='?' />}
							{toast.title}
						</StyledToastTitle>
						<StyledToastDescription>{toast.description}</StyledToastDescription>
						<StyledToastClose>
							<span aria-hidden>×</span>
						</StyledToastClose>
					</StyledToastRoot>
				))}
				<StyledToastViewport />
			</Toast.Provider>
		</div>
	)
}
