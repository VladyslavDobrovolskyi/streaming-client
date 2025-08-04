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
import { apiClient, Movie } from '../api/ApiClient'
import Loader from '../components/player/Loader'

// Add this after your imports
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

export default function RoomPage() {
	useEffect(() => {
		const reloadedOnce = localStorage.getItem('reloadedOnce')
		if (!reloadedOnce) {
			localStorage.setItem('reloadedOnce', 'true')
			window.location.reload()
		}
	}, [])

	const [toasts, setToasts] = useState<ToastNotification[]>([])
	const { id: roomID } = useParams<{ id: string }>() // Брать отсюда, не дублировать получение
	const [movieInfo, setMovieInfo] = useState<Movie>()
	const [isDragging, setIsDragging] = useState(false)
	const [isPlaying, setIsPlaying] = useState(false)
	const [volume, setVolume] = useState(0.8)
	const [muted, setMuted] = useState(false)
	const [played, setPlayed] = useState(0)
	const [loaded, setLoaded] = useState<number>(0)
	const [showControls, setShowControls] = useState(false)
	const [showVolumeControl, setShowVolumeControl] = useState(false)
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [duration, setDuration] = useState(0)
	const [isVolumeActive, setIsVolumeActive] = useState(false)
	const [mutedBySlider, setMutedBySlider] = useState(false)
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	// Add loading state variables
	const [isLoading, setIsLoading] = useState(true)
	const [currentAction, setCurrentAction] = useState<
		'play' | 'pause' | 'mute' | 'unmute' | 'forward' | 'backward' | 'volume' | null
	>(null)
	const {
		clients,
		provideMediaRef,
		localStream,
		localPeerId,
		reinitializeStream,
		reinitializeStreamWithRemoteUser,
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
	const [hideMe, setHideMe] = useState(false)
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [hoveredItem, setHoveredItem] = useState<string | null>(null)
	const [showUserList, setShowUserList] = useState(false)
	const [highlightedUser, setHighlightedUser] = useState<string | null>(null)
	const [isRoomChatIsActive, setIsRoomChatIsActive] = useState(false)
	const [showChat, setShowChat] = useState(false)
	const [chatInput, setChatInput] = useState('')
	const [localUsername, setLocalUsername] = useState('')
	const [avatar, setAvatar] = useState('')
	const [privateChats, setPrivateChats] = useState<Record<string, boolean>>({})
	const [clientSizes, setClientSizes] = useState<Record<string, { width: number; height: number; scale?: number }>>(
		{}
	)
	const [notificationStatus, setNotificationStatus] = useState(true)
	const [clientVolumes, setClientVolumes] = useState<Record<string, number>>({})
	const [camerasOpacity, setCamerasOpacity] = useState<Record<string, number>>({})
	const [clientCameras, setClientCameras] = useState<Record<string, boolean>>({})
	const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({})
	// Add a new state for tracking unread room chat messages after the unreadMessages state
	const [unreadRoomMessages, setUnreadRoomMessages] = useState(0)

	const [isTyping, setIsTyping] = useState(false)
	// Add a ref to track the last seen message count after the unreadRoomMessages state
	const lastSeenMessageCountRef = useRef(0)
	const userListWidth = 380
	const playerRef = useRef<ReactPlayer>(null)
	const controlsTimeoutRef = useRef<number | null>(null)
	const playerWrapperRef = useRef<HTMLDivElement>(null)
	const previousVolumeRef = useRef(volume)
	const previousUsersVolumesRef = useRef(new Map())
	const {
		userData,
		updateUserPosition,
		updateUserSize,
		updateUserStatus,
		updateUserVolume,
		updateUserCameraVisibility,
		updateNotificationStatus,
		updateUserCameraOpacity,
	} = useLocalStorageSync(roomID!)

	// Add handlers for video
	//
	// Check if the page has been reloaded once

	const handleReady = () => {
		setIsLoading(false)
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

	// Store previous volumes in a Map to remember them between toggles
	const previousVolumesRef = useRef(new Map())

	// Define an interface for the options parameter
	interface ToggleMicOptions {
		action?: 'mute' | 'unmute'
		previousVolume?: number
	}

	const changeRemoteVolume = (clientID: string, newVolume: number, options: { previousVolume?: number } = {}) => {
		console.log(`Changing volume for ${clientID}: ${newVolume}` + options)

		// If volume is 0, save the previous value
		if (newVolume === 0 && clientVolumes[clientID] > 0) {
			previousVolumesRef.current.set(clientID, clientVolumes[clientID])
			console.log(`Volume reached 0, saving previous volume: ${clientVolumes[clientID]}`)
		}

		// Update volume state
		setClientVolumes(prev => {
			const updatedVolumes = { ...prev, [clientID]: newVolume }

			// Update video element directly for immediate effect
			const videoElement = document.querySelector(`video[data-client-id="${clientID}"]`) as HTMLVideoElement
			if (videoElement) {
				videoElement.volume = newVolume
				// If volume is 0, set muted=true, otherwise muted=false
				videoElement.muted = newVolume === 0
				console.log(`Updated video element: volume=${newVolume}, muted=${newVolume === 0}`)
			} else {
				console.log(`Video element not found for client ${clientID}`)
			}

			// Persist volume change
			updateUserVolume(clientID, newVolume)

			return updatedVolumes
		})
	}
	// Update the function signature with proper typing
	const toggleRemoteMic = (clientID: string, options: ToggleMicOptions = {}) => {
		console.log(`Before toggle: clientVolumes[${clientID}] =`, clientVolumes[clientID])

		// Get current volume, default to 0.5 if not set
		const currentVolume = clientVolumes[clientID] !== undefined ? clientVolumes[clientID] : 0.5

		// If we're unmuting with a specific previous volume from our enhanced handler
		if (options.action === 'unmute' && options.previousVolume !== undefined) {
			console.log(`Unmuting ${clientID} with saved volume: ${options.previousVolume}`)

			// Update the state with the saved volume
			setClientVolumes(prev => {
				const updatedVolumes = { ...prev, [clientID]: options.previousVolume! }

				// Update the video element directly for immediate effect
				const videoElement = document.querySelector(`video[data-client-id="${clientID}"]`) as HTMLVideoElement
				if (videoElement) {
					videoElement.volume = options.previousVolume!
					videoElement.muted = false
					console.log(`Updated video element: volume=${options.previousVolume}, muted=false`)
				} else {
					console.log(`Video element not found for client ${clientID}`)
				}

				// Persist the volume change
				updateUserVolume(clientID, options.previousVolume!)

				return updatedVolumes
			})

			return
		}

		// If we're muting with a specific action
		if (options.action === 'mute' && options.previousVolume !== undefined) {
			console.log(`Muting ${clientID}, saving volume: ${options.previousVolume}`)
			previousVolumesRef.current.set(clientID, options.previousVolume)

			// Set volume to 0
			setClientVolumes(prev => {
				const updatedVolumes = { ...prev, [clientID]: 0 }

				// Update the video element directly for immediate effect
				const videoElement = document.querySelector(`video[data-client-id="${clientID}"]`) as HTMLVideoElement
				if (videoElement) {
					videoElement.volume = 0
					videoElement.muted = true
					console.log(`Updated video element: volume=0, muted=true`)
				} else {
					console.log(`Video element not found for client ${clientID}`)
				}

				// Persist the volume change
				updateUserVolume(clientID, 0)

				return updatedVolumes
			})

			return
		}

		// Standard toggle behavior (for backward compatibility)
		if (currentVolume > 0) {
			// Save the current volume before muting
			previousVolumesRef.current.set(clientID, currentVolume)
			console.log(`Saving volume for ${clientID}: ${currentVolume}`)

			// Mute by setting volume to 0
			setClientVolumes(prev => {
				const updatedVolumes = { ...prev, [clientID]: 0 }

				// Update the video element directly
				const videoElement = document.querySelector(`video[data-client-id="${clientID}"]`) as HTMLVideoElement
				if (videoElement) {
					videoElement.volume = 0
					videoElement.muted = true
					console.log(`Updated video element: volume=0, muted=true`)
				} else {
					console.log(`Video element not found for client ${clientID}`)
				}

				// Persist the volume change
				updateUserVolume(clientID, 0)

				return updatedVolumes
			})
		} else {
			// Get the previous volume if available, otherwise use default (0.5)
			const previousVolume = previousVolumesRef.current.get(clientID) || 0.5
			console.log(`Restoring volume for ${clientID}: ${previousVolume}`)

			// Unmute by restoring the previous volume
			setClientVolumes(prev => {
				const updatedVolumes = { ...prev, [clientID]: previousVolume }

				// Update the video element directly
				const videoElement = document.querySelector(`video[data-client-id="${clientID}"]`) as HTMLVideoElement
				if (videoElement) {
					videoElement.volume = previousVolume
					videoElement.muted = false
					console.log(`Updated video element: volume=${previousVolume}, muted=false`)
				} else {
					console.log(`Video element not found for client ${clientID}`)
				}

				// Persist the volume change
				updateUserVolume(clientID, previousVolume)

				return updatedVolumes
			})
		}
	}
	const toggleRemoteCamera = (clientID: string) => {
		setClientCameras(prev => {
			const currentVisibility = prev[clientID] ?? true
			const newVisibility = !currentVisibility

			// Если это локальное видео, синхронизируем с реальным состоянием трека
			if (clientID === LOCAL_VIDEO && localStream) {
				const videoTrack = localStream.getVideoTracks()[0]
				if (videoTrack) {
					videoTrack.enabled = newVisibility
					console.log(`Local camera ${newVisibility ? 'enabled' : 'disabled'}`)
				}
			}

			const videoElement = document.querySelector(`video[data-client-id="${clientID}"]`) as HTMLVideoElement
			if (videoElement) {
				const grandParentElement = videoElement.parentElement?.parentElement as HTMLElement
				if (grandParentElement) {
					grandParentElement.style.display = newVisibility ? 'block' : 'none'
				}
			}
			updateUserCameraVisibility(clientID, newVisibility)

			return { ...prev, [clientID]: newVisibility }
		})
	}

	const changeRemoteCameraOpacity = (clientID: string, opacity: number) => {
		const videoElement = document.querySelector(`video[data-client-id="${clientID}"]`) as HTMLVideoElement
		if (videoElement) {
			const grandParentElement = videoElement.parentElement?.parentElement as HTMLElement
			if (grandParentElement) {
				grandParentElement.style.opacity = `${opacity}`
			}
		}
		setCamerasOpacity(prev => ({ ...prev, [clientID]: opacity }))
		updateUserCameraOpacity(clientID, opacity)
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
		requestTimeAndState,
	} = useRoomSync(
		roomID!,
		playerRef,
		localUsername,
		avatar,
		isCameraDisabled,
		isMicrophoneDisabled,
		addToast,
		localPeerId,
		isLoading
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

		// setMicMuted(initialMicrophoneDisabledState)
		// setCameraMuted(initialCameraDisabledState)
		
		// Дополнительная проверка состояния камеры при загрузке
		if (localStream && !isLoading) {
			const videoTrack = localStream.getVideoTracks()[0]
			if (videoTrack) {
				console.log('Initial video track state:', videoTrack.enabled)
				console.log('Initial camera disabled state:', isCameraDisabled)
				// Синхронизируем состояние с реальным состоянием трека
				if (videoTrack.enabled !== !isCameraDisabled) {
					console.log('Fixing camera state mismatch on load')
					setCameraMuted(!videoTrack.enabled)
				}
			}
		}
	}, [loaded, localStream, isLoading, isCameraDisabled])

	useEffect(() => {
		if (localPeerId) {
			updateNotificationStatus(LOCAL_VIDEO, notificationStatus)
		}
	}, [notificationStatus, localPeerId, updateNotificationStatus])

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

		const currentTime = playerRef.current?.getCurrentTime() || 0
		const direction = value[0] > currentTime ? 'forward' : 'backward'
		setLastSeekDirection(direction)
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
		if (!isDragging && !isMenuOpen && !showUserList) {
			controlsTimeoutRef.current = setTimeout(() => {
				setShowControls(false)
			}, 3000) as unknown as number
		}
	}, [isDragging, isMenuOpen, showUserList])

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
			if (isLoading) return

			if (!isTyping) {
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

	// Добавляем эффект для синхронизации состояния после переинициализации
	useEffect(() => {
		if (localStream) {
			const videoTrack = localStream.getVideoTracks()[0]
			if (videoTrack) {
				// Проверяем, нужно ли синхронизировать состояние
				const shouldBeDisabled = isCameraDisabled
				const isCurrentlyEnabled = videoTrack.enabled
				
				if (shouldBeDisabled && isCurrentlyEnabled) {
					console.log('Syncing camera state after reinitialization - disabling')
					videoTrack.enabled = false
				} else if (!shouldBeDisabled && !isCurrentlyEnabled) {
					console.log('Syncing camera state after reinitialization - enabling')
					videoTrack.enabled = true
				}
			}
			
			const audioTrack = localStream.getAudioTracks()[0]
			if (audioTrack) {
				// Проверяем, нужно ли синхронизировать состояние микрофона
				const shouldBeDisabled = isMicrophoneDisabled
				const isCurrentlyEnabled = audioTrack.enabled
				
				if (shouldBeDisabled && isCurrentlyEnabled) {
					console.log('Syncing microphone state after reinitialization - disabling')
					audioTrack.enabled = false
				} else if (!shouldBeDisabled && !isCurrentlyEnabled) {
					console.log('Syncing microphone state after reinitialization - enabling')
					audioTrack.enabled = true
				}
			}
		}
	}, [localStream, isCameraDisabled, isMicrophoneDisabled])

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
				// Проверяем текущее состояние трека
				const isCurrentlyEnabled = audioTrack.enabled
				console.log('Current audio track enabled state:', isCurrentlyEnabled)
				
				if (isCurrentlyEnabled) {
					audioTrack.enabled = false
					setMicMuted(true)
					emitInfoSync(localUsername, avatar, isCameraDisabled, true)
					updateUserStatus(LOCAL_VIDEO, { isCameraDisabled, isMicrophoneDisabled: true })
					console.log('Microphone disabled')
				} else {
					audioTrack.enabled = true
					setMicMuted(false)
					emitInfoSync(localUsername, avatar, isCameraDisabled, false)
					updateUserStatus(LOCAL_VIDEO, { isCameraDisabled, isMicrophoneDisabled: false })
					console.log('Microphone enabled')
				}
				
				// Дополнительная проверка через небольшую задержку
				setTimeout(() => {
					console.log('Final microphone state check:', audioTrack.enabled)
					if (audioTrack.enabled !== !isMicrophoneDisabled) {
						console.log('Microphone state mismatch detected, fixing...')
						audioTrack.enabled = !isMicrophoneDisabled
					}
				}, 100)
			} finally {
				console.log('After Toggle Audio Track:', audioTrack)
				console.log('Final audio track enabled state:', audioTrack.enabled)
			}
		} else {
			console.warn('Local stream not available for microphone toggle')
		}
	}

	const handleCameraMuteUnmute = () => {
		if (localStream) {
			const videoTrack = localStream.getVideoTracks()[0]
			console.log('Before Toggle Video Track:', videoTrack)
			try {
				// Проверяем текущее состояние трека
				const isCurrentlyEnabled = videoTrack.enabled
				console.log('Current video track enabled state:', isCurrentlyEnabled)
				
				if (isCurrentlyEnabled) {
					videoTrack.enabled = false
					setCameraMuted(true)
					emitInfoSync(localUsername, avatar, true, isMicrophoneDisabled)
					updateUserStatus(LOCAL_VIDEO, { isCameraDisabled: true, isMicrophoneDisabled })
					console.log('Camera disabled')
				} else {
					videoTrack.enabled = true
					setCameraMuted(false)
					emitInfoSync(localUsername, avatar, false, isMicrophoneDisabled)
					updateUserStatus(LOCAL_VIDEO, { isCameraDisabled: false, isMicrophoneDisabled })
					console.log('Camera enabled')
				}
				
				// Дополнительная проверка через небольшую задержку
				setTimeout(() => {
					console.log('Final camera state check:', videoTrack.enabled)
					if (videoTrack.enabled !== !isCameraDisabled) {
						console.log('State mismatch detected, fixing...')
						videoTrack.enabled = !isCameraDisabled
					}
				}, 100)
			} finally {
				console.log('After Toggle Video Track:', videoTrack)
				console.log('Final video track enabled state:', videoTrack.enabled)
			}
		} else {
			console.warn('Local stream not available for camera toggle')
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
	async function fetchMovieInfo() {
		const roomUUID = new URL(window.location.href).pathname.split('/').pop() || ''
		const movieID = await apiClient.roomInfo(roomUUID)
		if (!movieID) {
			window.location.href = '/'
			return
		}
		const movieInfoResponse = await apiClient.getMovieInfo(Number(movieID))
		if (!movieInfoResponse) {
			window.location.href = '/'
			return
		}
		console.log('Movie Info:', movieInfoResponse)
		setMovieInfo(movieInfoResponse)
	}
	async function fetchUserData() {
		const userInfo = await apiClient.getUserInfo()
		if (!userInfo) {
			window.location.href = '/'
			return
		}
		const avatar = await apiClient.getAvatarImg()
		if (!avatar) {
			window.location.href = '/'
			return
		}
		console.log('Avatar:', avatar)

		setLocalUsername(userInfo.username)
		setAvatar(String(avatar.url))
	}

	async function amIAuthorized() {
		try {
			const response = await apiClient.getUserInfo()
			if (response) {
				setIsAuthenticated(true)
				return true
			}
		} catch {
			setIsAuthenticated(false)
			window.location.href = '/'
		}
	}

	async function handshakeSeance() {
		const roomUUID = new URL(window.location.href).pathname.split('/').pop() || ''
		const response = await apiClient.handshakeSeance({ roomUUID: roomUUID })

		if (!response) {
			window.location.href = '/'
			return
		}

		if (response.status === false) {
			window.location.href = '/'
			return
		}
	}

	// async function joinRoom(pass?: string) {
	// 	const roomUUID = new URL(window.location.href).pathname.split('/').pop() || ''
	// 	if (!pass) {
	// 		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// 		const response = await apiClient.joinRoom({ roomUUID: roomUUID })
	// 	} else {
	// 		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// 		const response = await apiClient.joinRoom({ roomUUID: roomUUID, password: pass })
	// 	}
	// }

	useEffect(() => {
		amIAuthorized()
		handshakeSeance()
		fetchUserData()
		fetchMovieInfo()
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
		const interval = setInterval(() => {
			apiClient.continueSeance()
		}, 300000) // 300000 milliseconds = 5 minutes

		return () => clearInterval(interval)
	}, [])

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

	// Modify the closeChat function to reset unread messages
	const closeChat = () => {
		setShowChat(false)
	}

	// Add this effect to track new room chat messages
	useEffect(() => {
		// Only count unread messages when the chat is closed
		if (!showChat && chatMessages.length > 0) {
			// Only increment for messages that arrived after the chat was last closed
			if (chatMessages.length > lastSeenMessageCountRef.current) {
				setUnreadRoomMessages(chatMessages.length - lastSeenMessageCountRef.current)
			}
		} else if (showChat) {
			// When chat is open, keep the lastSeenMessageCount updated with the current message count
			// This ensures we're always tracking the latest seen message
			lastSeenMessageCountRef.current = chatMessages.length
		}
	}, [chatMessages, showChat])

	// Modify the handleToggleChat function to update the last seen count when opening chat
	const handleToggleChat = () => {
		if (!showChat) {
			// Opening the chat - reset unread count and update last seen
			setUnreadRoomMessages(0)
			lastSeenMessageCountRef.current = chatMessages.length
		} else {
			// Closing the chat - update last seen count
			lastSeenMessageCountRef.current = chatMessages.length
		}
		setShowChat(prev => !prev)
	}

	useEffect(() => {
		const storedPositions = Object.entries(userData).reduce((acc, [clientId, data]) => {
			if (data.position) {
				acc[clientId] = data.position
			}
			return acc
		}, {} as Record<string, UserPosition>)

		setClientPositions(prev => ({ ...prev, ...storedPositions }))

		const storedSizes = Object.entries(userData).reduce((acc, [clientId, data]) => {
			if (data.size) {
				acc[clientId] = data.size
			}
			return acc
		}, {} as Record<string, { width: number; height: number; scale?: number }>)
		setClientSizes(prev => ({ ...prev, ...storedSizes }))

		const storedVolumes = Object.entries(userData).reduce((acc, [clientId, data]) => {
			if (data.volume !== undefined) {
				acc[clientId] = clientId === LOCAL_VIDEO ? 0 : data.volume
			}
			return acc
		}, {} as Record<string, number>)

		setClientVolumes(prev => ({ ...prev, ...storedVolumes }))

		const storedCameraVisibility = Object.entries(userData).reduce((acc, [clientId, data]) => {
			if (data.cameraVisible !== undefined) {
				acc[clientId] = data.cameraVisible
				if (clientId === LOCAL_VIDEO) {
					setHideMe(!data.cameraVisible)
				}
			}
			return acc
		}, {} as Record<string, boolean>)
		setClientCameras(prev => ({ ...prev, ...storedCameraVisibility }))

		const storedCamerasOpacity = Object.entries(userData).reduce((acc, [clientId, data]) => {
			if (data.cameraOpacity !== undefined) {
				acc[clientId] = data.cameraOpacity
				console.log('Setting camera opacity:', clientId, data.cameraOpacity)
			}
			return acc
		}, {} as Record<string, number>)

		Object.entries(storedCamerasOpacity).forEach(([clientId, opacity]) =>
			changeRemoteCameraOpacity(clientId, opacity)
		)

		const storedNotifications = Object.entries(userData).reduce((acc, [clientId, data]) => {
			if (clientId === LOCAL_VIDEO && data.notificationStatus !== undefined) {
				acc[clientId] = data.notificationStatus
			}
			return acc
		}, {} as Record<string, boolean>)
		setNotificationStatus(storedNotifications[LOCAL_VIDEO] ?? true)

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userData])

	useEffect(() => {
		console.log('Clients Object:', clients)
		console.log('Participant Info Object:', participantInfo)
	}, [clients, participantInfo])

	useEffect(() => {
		if (!isLoading) {
			if (playerRef.current) {
				const playerElement = playerRef.current.getInternalPlayer()
				if (playerElement) {
					playerElement.onclick = isPlaying ? handlePause : handlePlay
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isLoading, isPlaying])

	useEffect(() => {
		if (isLoading) {
			clients.forEach(clientID => {
				const videoElement = document.querySelector(`video[data-client-id="${clientID}"]`) as HTMLVideoElement
				if (videoElement) {
					videoElement.muted = true
				}
			})
		} else {
			clients.forEach(clientID => {
				const videoElement = document.querySelector(`video[data-client-id="${clientID}"]`) as HTMLVideoElement
				if (videoElement) {
					videoElement.muted = false
				}
			})
		}
		requestTimeAndState()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isLoading, requestTimeAndState])

	useEffect(() => {
		if (localStream) {
			const videoTrack = localStream.getVideoTracks()[0]
			if (videoTrack) {
				// Синхронизируем состояние с реальным состоянием трека
				const isTrackEnabled = videoTrack.enabled
				if (isTrackEnabled !== !isCameraDisabled) {
					console.log('Syncing camera state with track state:', isTrackEnabled)
					setCameraMuted(!isTrackEnabled)
				}
			}
		}
	}, [localStream, isCameraDisabled])

	useEffect(() => {
		if (localStream) {
			const audioTrack = localStream.getAudioTracks()[0]
			if (audioTrack) {
				// Синхронизируем состояние с реальным состоянием трека
				const isTrackEnabled = audioTrack.enabled
				if (isTrackEnabled !== !isMicrophoneDisabled) {
					console.log('Syncing microphone state with track state:', isTrackEnabled)
					setMicMuted(!isTrackEnabled)
				}
			}
		}
	}, [localStream, isMicrophoneDisabled])

	// Check if the user is authenticated before rendering the player
	if (!isAuthenticated) {
		return null
	}

	return (
		<div
			ref={playerWrapperRef}
			onMouseEnter={() => {
				setHighlightedUser(null)
				setIsRoomChatIsActive(false)
			}}
			className={`player-wrapper ${isPlaying ? 'playing' : ''}`}
			onMouseMove={showControlsHandler}
			onMouseLeave={() => {
				if (!isDragging && !isMenuOpen && !showUserList) {
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
			{movieInfo && (
				<ReactPlayer
					ref={playerRef}
					className='react-player'
					url={`${movieInfo.resource}`}
					controls={false}
					playing={isPlaying}
					volume={volume}
					muted={muted}
					onPlay={() => setIsPlaying(true)}
					onPause={() => setIsPlaying(false)}
					onProgress={handleProgress}
					onDuration={duration => setDuration(duration)}
					onReady={handleReady}
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
			)}
			{isLoading && <Loader />}
			<ParticipantsView
				reinitializeStream={reinitializeStreamWithRemoteUser}
				previousVolumesRef={previousUsersVolumesRef}
				clients={clients}
				setHideMe={setHideMe}
				participantInfo={participantInfo}
				provideMediaRef={provideMediaRef}
				localVideoId={LOCAL_VIDEO}
				isCameraDisabled={isCameraDisabled}
				isMicrophoneDisabled={isMicrophoneDisabled}
				clientPositions={clientPositions}
				clientCameras={clientCameras}
				clientSizes={clientSizes}
				coveredClients={coveredClients}
				toggleRemoteCamera={toggleRemoteCamera}
				clientVolumes={clientVolumes}
				highlightedUser={highlightedUser}
				onPositionChange={(id, pos) => {
					setClientPositions(prev => ({ ...prev, [id]: pos }))
					updateUserPosition(id, pos)
				}}
				onSizeChange={(id, size) => {
					setClientSizes(prev => ({ ...prev, [id]: size }))
					updateUserSize(id, size)
				}}
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
				{!isLoading && <ActionIndicator action={currentAction} volume={volume} />}
			</div>
			<VideoControls
				isPlaying={isPlaying}
				muted={muted}
				volume={volume}
				played={played}
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
				hideMe={hideMe}
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
				hideMeToggle={() => {
					toggleRemoteCamera(LOCAL_VIDEO)
					setHideMe(prev => !prev)
					
					// Дополнительная синхронизация с реальным состоянием трека
					if (localStream) {
						const videoTrack = localStream.getVideoTracks()[0]
						if (videoTrack) {
							const newState = !hideMe
							videoTrack.enabled = newState
							console.log(`Hide me toggle: camera ${newState ? 'enabled' : 'disabled'}`)
						}
					}
				}}
				onHoveredItemChange={setHoveredItem}
				onToggleChat={handleToggleChat}
				unreadRoomMessages={unreadRoomMessages}
				formatTime={formatTime}
				getSpeakerIcon={getSpeakerIcon}
				initialMicrophoneDisabledState={initialMicrophoneDisabledState}
				initialCameraDisabledState={initialCameraDisabledState}
				notificationStatus={notificationStatus}
				setNotificationStatus={setNotificationStatus}
			/>
			<UserList
				previousVolumesRef={previousUsersVolumesRef}
				changeRemoteVolume={changeRemoteVolume}
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
				privateChats={privateChats}
				changeCameraOpacity={changeRemoteCameraOpacity}
				camerasOpacity={camerasOpacity}
			/>
			{showChat && (
				<RoomChat
					isTyping={isTyping}
					setIsTyping={setIsTyping}
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
					isRoomChatIsActive={isRoomChatIsActive}
				/>
			)}
			{Object.entries(privateChats).map(
				([clientID, isOpen]) =>
					isOpen && (
						<PrivateChat
							isTyping={isTyping}
							setIsTyping={setIsTyping}
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

			{notificationStatus && <ToastNotifications toasts={toasts} />}
		</div>
	)
}
