'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import socket from '../socket/index.ts'
import ACTIONS from '../socket/actions'
import type ReactPlayer from 'react-player'

export default function useRoomSync(
	roomID: string,
	videoRef: React.RefObject<ReactPlayer>,
	localUsername: string,
	avatar: string,
	isCameraDisabled: boolean,
	isMicrophoneDisabled: boolean,
	addToast: (avatar: string, title: string, description: string) => void,
	localPeerId: string
) {
	const isSyncingRef = useRef(false)
	const [lastSeekDirection, setLastSeekDirection] = useState<'forward' | 'backward' | null>(null)
	const [participantInfo, setParticipantInfo] = useState<
		Record<
			string,
			{
				username: string
				avatar: string
				isCameraDisabled: boolean
				isMicrophoneDisabled: boolean
				notified?: boolean
			}
		>
	>({})
	// const [participantCameras, setParticipantCameras] = useState<Record<string, boolean>>({})
	// const [participantMicrophones, setParticipantMicrophones] = useState<Record<string, boolean>>({})

	const handlePlay = useCallback(
		({ socketID, time }: { socketID: string; time: number }) => {
			if (!videoRef.current || isSyncingRef.current) return
			console.log(participantInfo[socketID])
			console.log('Received play event:', { time })
			addToast(
				participantInfo[socketID].avatar,
				'Syncing',
				`${participantInfo[socketID]?.username || 'Someone'} started playing the video`
			)
			isSyncingRef.current = true
			videoRef.current.seekTo(time, 'seconds')
			videoRef.current.getInternalPlayer().play()
			isSyncingRef.current = false
		},
		[videoRef, participantInfo, addToast]
	)

	const handlePause = useCallback(
		({ socketID, time }: { socketID: string; time: number }) => {
			if (!videoRef.current || isSyncingRef.current) return
			addToast(
				participantInfo[socketID].avatar,
				'Syncing',
				`${participantInfo[socketID]?.username || 'Someone'} stopped the video`
			)
			isSyncingRef.current = true
			videoRef.current.seekTo(time, 'seconds')
			videoRef.current.getInternalPlayer().pause()
			isSyncingRef.current = false
		},
		[videoRef, participantInfo, addToast]
	)
	const handleSeek = useCallback(
		({ socketID, time, direction }: { socketID: string; time: number; direction: 'forward' | 'backward' }) => {
			if (!videoRef.current || isSyncingRef.current) return

			isSyncingRef.current = true
			videoRef.current.seekTo(time, 'seconds')
			isSyncingRef.current = false

			addToast(
				participantInfo[socketID].avatar,
				'Syncing',
				`${participantInfo[socketID]?.username || 'Someone'} seeked the video`
			)
			setLastSeekDirection(direction)

			console.log('Received seek event:', { time, direction })
		},
		[videoRef, participantInfo, addToast]
	)

	useEffect(() => {
		const newUserIDs = Object.keys(participantInfo).filter(
			id => !participantInfo[id].notified && id !== localPeerId
		)

		newUserIDs.forEach(id => {
			const interval = setInterval(() => {
				if (participantInfo[id].avatar) {
					addToast(
						participantInfo[id].avatar,
						'New Participant',
						`${participantInfo[id].username} has joined the room`
					)
					setParticipantInfo(prev => ({
						...prev,
						[id]: {
							...prev[id],
							notified: true,
						},
					}))
					clearInterval(interval)
				}
			}, 100)
		})
	}, [participantInfo, localPeerId, addToast])
	// const handleCameraSync = useCallback(
	// 	({ socketId, isCameraDisabled }: { socketId: string; isCameraDisabled: boolean }) => {
	// 		console.log('Received camera sync event:', { socketId, isCameraDisabled })

	// 		setParticipantInfo(prev => ({
	// 			...prev,
	// 			[socketId]: {
	// 				...prev[socketId],
	// 				isCameraDisabled,
	// 			},
	// 		}))
	// 	},
	// 	[]
	// )

	// const handleMicrophoneSync = useCallback(
	// 	({ socketId, isMicrophoneDisabled }: { socketId: string; isMicrophoneDisabled: boolean }) => {
	// 		console.log('Received microphone sync event:', { socketId, isMicrophoneDisabled })

	// 		setParticipantInfo(prev => ({
	// 			...prev,
	// 			[socketId]: {
	// 				...prev[socketId],
	// 				isMicrophoneDisabled,
	// 			},
	// 		}))
	// 	},
	// 	[]
	// )

	// type ParticipantInfo = {
	// 	username: string
	// 	avatar: string
	// 	isCameraDisabled: boolean
	// 	isMicrophoneDisabled: boolean
	// }

	// // Define the type for the function parameter
	// type InfoSyncParams = {
	// 	socketId: string
	// } & Partial<ParticipantInfo>

	// const handleInfoSync = useCallback((params: InfoSyncParams) => {
	// 	const { socketId, ...updatedInfo } = params

	// 	console.log('Received info sync event:', params)

	// 	setParticipantInfo(prev => ({
	// 		...prev,
	// 		[socketId]: {
	// 			...prev[socketId],
	// 			...updatedInfo,
	// 		},
	// 	}))

	// 	if ('isCameraDisabled' in updatedInfo) {
	// 		setParticipantCameras(prev => ({
	// 			...prev,
	// 			[socketId]: updatedInfo.isCameraDisabled!,
	// 		}))
	// 	}

	// 	if ('isMicrophoneDisabled' in updatedInfo) {
	// 		setParticipantMicrophones(prev => ({
	// 			...prev,
	// 			[socketId]: updatedInfo.isMicrophoneDisabled!,
	// 		}))
	// 	}
	// }, [])
	const handleInfoSync = useCallback(
		({
			socketId,
			avatar,
			username,
			isCameraDisabled,
			isMicrophoneDisabled,
		}: {
			socketId: string
			username: string
			avatar: string
			isCameraDisabled: boolean
			isMicrophoneDisabled: boolean
		}) => {
			console.log('Received info sync event:', {
				socketId,
				avatar,
				username,
				isCameraDisabled,
				isMicrophoneDisabled,
			})

			setParticipantInfo(prev => ({
				...prev,
				[socketId]: {
					username,
					avatar,
					isCameraDisabled,
					isMicrophoneDisabled,
					notified: prev[socketId]?.notified ?? false,
				},
			}))
		},
		[]
	)

	const handleSyncRequest = useCallback(() => {
		if (videoRef.current) {
			const currentTime = videoRef.current.getCurrentTime()
			const isPlaying = !videoRef.current.getInternalPlayer().paused
			socket.emit(ACTIONS.SYNC_STATE, {
				roomID,
				time: currentTime,
				isPlaying,
			})
		}
	}, [roomID, videoRef])

	const handleRequestParticipantInfo = useCallback(
		({ requesterId }) => {
			console.log('[DEBUG] Received request participant info event:', { requesterId })
			console.log('current micDis:', isMicrophoneDisabled)
			console.log('current camDis:', isCameraDisabled)
			console.log('Sending participant info:', {
				roomID,
				requesterId,
				info: {
					username: participantInfo[socket.id]?.username || localUsername || 'Unknown',
					avatar,
					isCameraDisabled,
					isMicrophoneDisabled,
				},
			})

			if (videoRef.current) {
				const currentTime = videoRef.current.getCurrentTime()
				const isPlaying = !videoRef.current.getInternalPlayer().paused
				socket.emit(ACTIONS.SYNC_STATE, {
					roomID,
					time: currentTime,
					isPlaying,
				})
			}
			socket.emit(ACTIONS.SEND_PARTICIPANT_INFO, {
				roomID,
				requesterId,
				info: {
					username: participantInfo[socket.id]?.username || localUsername || 'Unknown',
					avatar,
					isCameraDisabled,
					isMicrophoneDisabled,
				},
			})
		},
		[roomID, participantInfo, localUsername, avatar, isCameraDisabled, isMicrophoneDisabled, videoRef]
	)

	const handleClientLeave = useCallback(
		({ peerID }) => {
			if (!participantInfo[peerID]) return

			const interval = setInterval(() => {
				if (participantInfo[peerID]?.avatar) {
					addToast(
						participantInfo[peerID].avatar,
						'Participant Left',
						`${participantInfo[peerID]?.username || 'Someone'} has left the room`
					)
					setParticipantInfo(prev => {
						const newParticipantInfo = Object.fromEntries(
							Object.entries(prev).filter(([key]) => key !== peerID)
						)
						return newParticipantInfo
					})
					clearInterval(interval)
				}
			}, 100)
		},
		[participantInfo, addToast]
	)

	const handlePrivateMessage = useCallback(
		({ from }) => {
			addToast(
				participantInfo[from].avatar,
				'New message',
				`New private message from ${participantInfo[from].username}`
			)
		},
		[participantInfo, addToast]
	)

	useEffect(() => {
		// socket.on(ACTIONS.VIDEO_PLAY, handlePlay)
		socket.on(ACTIONS.VIDEO_PAUSE, handlePause)
		socket.on(ACTIONS.VIDEO_SEEK, handleSeek)
		socket.on(ACTIONS.REQUEST_SYNC, handleSyncRequest)
		socket.on(ACTIONS.SYNC_INFO, handleInfoSync)
		socket.on(ACTIONS.REMOVE_PEER, handleClientLeave)
		socket.on(ACTIONS.RECEIVE_VIDEO_PLAY, handlePlay)
		// socket.on(ACTIONS.SYNC_CAMERA, handleCameraSync)
		// socket.on(ACTIONS.SYNC_MICROPHONE, handleMicrophoneSync)
		socket.on(ACTIONS.REQUEST_PARTICIPANT_INFO, handleRequestParticipantInfo)
		socket.on(ACTIONS.RECEIVE_PRIVATE_MESSAGE, handlePrivateMessage)

		return () => {
			socket.off(ACTIONS.VIDEO_PLAY, handlePlay)
			socket.off(ACTIONS.VIDEO_PAUSE, handlePause)
			socket.off(ACTIONS.VIDEO_SEEK, handleSeek)
			socket.off(ACTIONS.REQUEST_SYNC, handleSyncRequest)
			socket.off(ACTIONS.SYNC_INFO, handleInfoSync)
			// socket.off(ACTIONS.SYNC_CAMERA, handleCameraSync)
			// socket.off(ACTIONS.SYNC_MICROPHONE, handleMicrophoneSync)
			socket.off(ACTIONS.REQUEST_PARTICIPANT_INFO, handleRequestParticipantInfo)
			socket.off(ACTIONS.RECEIVE_VIDEO_PLAY, handlePlay)
			socket.off(ACTIONS.RECEIVE_PRIVATE_MESSAGE, handlePrivateMessage)
		}
	}, [
		handlePlay,
		handlePause,
		handleSeek,
		handleSyncRequest,
		handlePrivateMessage,
		handleClientLeave,
		// handleCameraSync,
		// handleMicrophoneSync,
		handleInfoSync,
		handleRequestParticipantInfo,
	])

	const emitPlay = useCallback(
		(time: number) => {
			socket.emit(ACTIONS.VIDEO_PLAY, { roomID, time })
		},
		[roomID]
	)

	const emitPause = useCallback(
		(time: number) => {
			socket.emit(ACTIONS.VIDEO_PAUSE, { roomID, time })
		},
		[roomID]
	)

	const emitSeek = useCallback(
		(time: number, direction: 'forward' | 'backward') => {
			socket.emit(ACTIONS.VIDEO_SEEK, { roomID, time, direction })
		},
		[roomID]
	)

	const requestSync = useCallback(() => {
		socket.emit(ACTIONS.REQUEST_SYNC, { roomID })
	}, [roomID])

	const emitInfoSync = useCallback(
		(username: string, avatar: string, isCameraDisabled: boolean, isMicrophoneDisabled: boolean) => {
			socket.emit(ACTIONS.SYNC_INFO, { roomID, username, avatar, isCameraDisabled, isMicrophoneDisabled })
		},
		[roomID]
	)

	const emitCameraSync = useCallback(
		(isCameraDisabled: boolean) => {
			socket.emit(ACTIONS.SYNC_CAMERA, { roomID, socketId: socket.id, isCameraDisabled })
		},
		[roomID]
	)

	const emitMicrophoneSync = useCallback(
		(isMicrophoneDisabled: boolean) => {
			socket.emit(ACTIONS.SYNC_MICROPHONE, {
				roomID,
				socketId: socket.id,
				isMicrophoneDisabled,
			})
		},
		[roomID]
	)

	const requestParticipantInfo = useCallback(() => {
		socket.emit(ACTIONS.REQUEST_PARTICIPANT_INFO, { roomID })
	}, [roomID])

	return {
		emitPlay,
		emitPause,
		emitSeek,
		emitInfoSync,
		emitCameraSync,
		emitMicrophoneSync,
		requestSync,
		requestParticipantInfo,
		lastSeekDirection,
		setLastSeekDirection,
		setParticipantInfo,
		participantInfo,
		// participantCameras,
		// participantMicrophones,
	}
}
