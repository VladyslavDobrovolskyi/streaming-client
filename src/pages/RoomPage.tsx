'use client'

// 03.08
import 'react-resizable/css/styles.css'
import ReactPlayer from 'react-player'
import { useParams } from 'react-router'
import { useState, useRef, useEffect, useCallback } from 'react'
import { SpeakerLoudIcon, SpeakerOffIcon, SpeakerQuietIcon, SpeakerModerateIcon } from '@radix-ui/react-icons'
import useWebRTC, { LOCAL_VIDEO } from '../hooks/useWebRTC'
import useRoomSync from '../hooks/useRoomSync'
import ActionIndicator from '../components/player/ActionIndicator'
import PrivateChat from '../components/chat/PrivateChat'
import RoomChat from '../components/chat/RoomChat'
import useLocalStorageSync from '../hooks/useLocalStorageSync'
import VideoControls from '../components/player/VideoControls'
import UserList from '../components/users/UserList'
import ParticipantsView from '../components/users/ParticipantsView'
import ToastNotifications from '../components/toast/ToastNotifications'
import { formatTime } from '../utils/formatTime'
import type { ToastNotification, UserPosition } from '../types/room-types'
import Loader from '../components/player/Loader'

// Add this after your imports
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

export default function RoomPage() {
	const [toasts, setToasts] = useState<ToastNotification[]>([])
	const { id: roomID } = useParams<{ id: string }>()
	const [isDragging, setIsDragging] = useState(false)
	const [isPlaying, setIsPlaying] = useState(false)
	const [volume, setVolume] = useState(0.8)
	const [muted, setMuted] = useState(false)
	const [played, setPlayed] = useState(0)
	const [loaded, setLoaded] = useState(0)
	const [showControls, setShowControls] = useState(false)
	const [showVolumeControl, setShowVolumeControl] = useState(false)
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [duration, setDuration] = useState(0)
	const [isVolumeActive, setIsVolumeActive] = useState(false)
	const [mutedBySlider, setMutedBySlider] = useState(false)
	// Add loading state variables
	const [isLoading, setIsLoading] = useState(true)
	const [isBuffering, setIsBuffering] = useState(false)
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
	const [showUserListButton, setShowUserListButton] = useState(false)
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
	const [clientCameras, setClientCameras] = useState<Record<string, boolean>>({})
	const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({})
	const userListWidth = 380
	const playerRef = useRef<ReactPlayer>(null)
	const controlsTimeoutRef = useRef<number | null>(null)
	const playerWrapperRef = useRef<HTMLDivElement>(null)
	const previousVolumeRef = useRef(volume)
	const { userData, updateUserPosition, updateUserStatus, updateUserVolume } = useLocalStorageSync(roomID!)

	// Add handlers for video loading states
	const handleReady = () => {
		setIsLoading(false)
	}

	const handleBuffer = () => {
		setIsBuffering(true)
	}

	const handleBufferEnd = () => {
		setIsBuffering(false)
	}

	const addToast = (avatar: string, title: string, description: string) => {
		setToasts(prev => {
			const existingToastIndex = prev.findIndex(
				toast => toast.title === title && toast.description === description
			)

			if (existingToastIndex > -1) {
				const updatedToasts = [...prev]
				updatedToasts[existingToastIndex] = {
					...updatedToasts[existingToastIndex],
					count: updatedToasts[existingToastIndex].count + 1,
				}
				const id = updatedToasts[existingToastIndex].id
				setTimeout(() => {
					setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id))
				}, 3000)
				return updatedToasts
			} else {
				const id = Math.random().toString(36).substr(2, 9)
				const newToasts = [...prev, { id, avatar, title, description, count: 1 }]
				setTimeout(() => {
					setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id))
				}, 3000)
				return newToasts
			}
		})
	}

	const toggleRemoteMic = (clientID: string) => {
		console.log(`Before toggle: clientVolumes[${clientID}] =`, clientVolumes[clientID])

		// Get current volume, default to 0.5 if not set
		const currentVolume = clientVolumes[clientID]

		// Toggle between muted (0) and unmuted (0.5)
		// If currentVolume is 0 or undefined, set to 0.5, otherwise set to 0
		const newVolume = currentVolume === 0 || currentVolume === undefined ? 0.5 : 0

		console.log(`Toggling mic for ${clientID}: ${currentVolume} -> ${newVolume}`)

		// Update the state
		setClientVolumes(prev => {
			const updatedVolumes = { ...prev, [clientID]: newVolume }
			console.log('Updated clientVolumes:', updatedVolumes)
			return updatedVolumes
		})

		// Update the video element directly for immediate effect
		const videoElement = document.querySelector(`video[data-client-id="${clientID}"]`) as HTMLVideoElement
		if (videoElement) {
			videoElement.volume = newVolume
			videoElement.muted = newVolume === 0
			console.log(`Updated video element: volume=${newVolume}, muted=${newVolume === 0}`)
		} else {
			console.log(`Video element not found for client ${clientID}`)
		}

		// Also update user volume in local storage for persistence
		updateUserVolume(clientID, newVolume)
	}

	const toggleRemoteCamera = (clientID: string) => {
		setClientCameras(prev => {
			const currentVisibility = prev[clientID] ?? true
			const newVisibility = !currentVisibility

			const videoElement = document.querySelector(`video[data-client-id="${clientID}"]`) as HTMLVideoElement
			if (videoElement) {
				const parentElement = videoElement.parentElement as HTMLElement
				if (parentElement) {
					parentElement.style.display = newVisibility ? 'block' : 'none'
				}
			}

			return { ...prev, [clientID]: newVisibility }
		})
	}

	const {
		emitPlay,
		emitPause,
		emitSeek,
		requestSync,
		emitInfoSync,
		setLastSeekDirection,
		lastSeekDirection,
		participantInfo,
		setParticipantInfo,
		requestParticipantInfo,
	} = useRoomSync(
		roomID!,
		playerRef,
		localUsername,
		avatar,
		isCameraDisabled,
		isMicrophoneDisabled,
		addToast,
		localPeerId
	)

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
				notified: true,
			},
		}))
	}, [localUsername, avatar, isCameraDisabled, isMicrophoneDisabled, setParticipantInfo, localPeerId])

	useEffect(() => {
		setShowUserListButton(showControls)

		if (!showControls) {
			setShowUserList(false)
		}
	}, [showControls])

	useEffect(() => {
		console.log('Participant info: ', participantInfo)
	}, [participantInfo])

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
	}, [lastSeekDirection, setLastSeekDirection])

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
		const isAnyChatOpen = Object.values(privateChats).some(chat => chat) || showChat
		const allChatsIsClosed = !isAnyChatOpen

		const handleKeyDown = (e: KeyboardEvent) => {
			if (allChatsIsClosed) {
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

	const getSpeakerIcon = () => {
		if (muted || volume === 0) return <SpeakerOffIcon style={{ opacity: 0.5 }} />
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

	const handleSendMessage = () => {
		if (chatInput.trim()) {
			sendChatMessage({ username: localUsername, message: chatInput.trim() })
			setChatInput('')
		}
	}

	useEffect(() => {
		console.log('Fetching avatar...')
		fetch('https://streaming.vladyslavdobrovolskyi.tech/get/emoji/')
			.then(res => res.json())
			.then(data => {
				setAvatar(data.url)
				console.log('Avatar fetched')
			})
			.catch(() => {
				console.log('Failed to fetch avatar')
			})
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
			} else {
				if (clientID !== localPeerId) {
					newUnreadMessages[clientID] = messages.filter(msg => !msg.read && msg.from !== localPeerId).length
					setUnreadMessages(newUnreadMessages)
				}
			}
		})
	}, [privateMessages, localPeerId, privateChats, setPrivateMessages])

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
			<style>{spinKeyframes}</style>
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
				onReady={handleReady}
				onBuffer={handleBuffer}
				onBufferEnd={handleBufferEnd}
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
			{(isLoading || isBuffering) && <Loader isLoading />}
			<ParticipantsView
				clients={clients}
				participantInfo={participantInfo}
				provideMediaRef={provideMediaRef}
				localVideoId={LOCAL_VIDEO}
				isCameraDisabled={isCameraDisabled}
				isMicrophoneDisabled={isMicrophoneDisabled}
				clientPositions={clientPositions}
				clientSizes={clientSizes}
				coveredClients={coveredClients}
				clientVolumes={clientVolumes}
				highlightedUser={highlightedUser}
				hideUsers={hideUsers}
				onPositionChange={(id, pos) => {
					setClientPositions(prev => ({ ...prev, [id]: pos }))
					updateUserPosition(id, pos)
				}}
				onSizeChange={(id, size) => setClientSizes(prev => ({ ...prev, [id]: size }))}
				onVolumeChange={(id, vol) => {
					setClientVolumes(prev => ({ ...prev, [id]: vol }))
					updateUserVolume(id, vol)
					const videoElement = document.querySelector(`video[data-client-id="${id}"]`) as HTMLVideoElement
					if (videoElement) {
						videoElement.volume = vol
						videoElement.muted = vol === 0
					}
				}}
				onCoverToggle={id => setCoveredClients(prev => ({ ...prev, [id]: !prev[id] }))}
				onHighlightChange={setHighlightedUser}
			/>
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
			<VideoControls
				isPlaying={isPlaying}
				muted={muted}
				volume={volume}
				played={played}
				loaded={loaded}
				duration={duration}
				isFullscreen={isFullscreen}
				showControls={showControls}
				setShowControls={setShowControls}
				showVolumeControl={showVolumeControl}
				setShowVolumeControl={setShowVolumeControl}
				isVolumeActive={isVolumeActive}
				isMenuOpen={isMenuOpen}
				isMicrophoneDisabled={isMicrophoneDisabled}
				isCameraDisabled={isCameraDisabled}
				isMovieMode={isMovieMode}
				hideUsers={hideUsers}
				hoveredItem={hoveredItem}
				isRoomChatIsActive={showChat}
				onPlay={handlePlay}
				onPause={handlePause}
				onSeekChange={handleSeekChange}
				onSeekStart={handleSeekStart}
				onSeekEnd={handleSeekEnd}
				onVolumeChange={handleVolumeChange}
				onToggleMuted={handleToggleMuted}
				onVolumePointerDown={handleVolumePointerDown}
				onVolumePointerUp={handleVolumePointerUp}
				onForward={handleForward15}
				onBackward={handleBackward15}
				onFullscreenToggle={handleFullscreenToggle}
				onMenuOpen={handleMenuOpen}
				onMenuClose={handleMenuClose}
				onMicMuteUnmute={handleMicMuteUnmute}
				onCameraMuteUnmute={handleCameraMuteUnmute}
				onMovieModeToggle={handleMovieModeToggle}
				onHideUsersToggle={() => setHideUsers(prev => !prev)}
				onHoveredItemChange={setHoveredItem}
				onToggleChat={() => setShowChat(prev => !prev)}
				formatTime={formatTime}
				getSpeakerIcon={getSpeakerIcon}
			/>
			<UserList
				showUserList={showUserList}
				toggleUserList={toggleUserList}
				clients={clients}
				participantInfo={participantInfo}
				localVideoId={LOCAL_VIDEO}
				isMicrophoneDisabled={isMicrophoneDisabled}
				isCameraDisabled={isCameraDisabled}
				highlightedUser={highlightedUser}
				setHighlightedUser={setHighlightedUser}
				togglePrivateChat={togglePrivateChat}
				unreadMessages={unreadMessages}
				toggleRemoteMic={toggleRemoteMic}
				toggleRemoteCamera={toggleRemoteCamera}
				avatar={avatar}
				userListWidth={userListWidth}
				showUserListButton={showUserListButton}
				participantVolume={clientVolumes}
				participantCameras={clientCameras}
				hideUsers={hideUsers}
				privateChats={privateChats}
			/>
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
					onMouseEnter={setHighlightedUser}
					onMouseLeave={() => setHighlightedUser(null)}
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
							highlight={clientID === highlightedUser}
						/>
					)
			)}
			<ToastNotifications toasts={toasts} />
		</div>
	)
}
