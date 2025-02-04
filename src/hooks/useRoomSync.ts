import { useEffect, useRef, useCallback, useState } from 'react'
import socket from '../socket'
import ACTIONS from '../socket/actions'
import type ReactPlayer from 'react-player'

export default function useRoomSync(roomID: string, videoRef: React.RefObject<ReactPlayer>) {
	const isSyncingRef = useRef(false)
	const [lastSeekDirection, setLastSeekDirection] = useState<'forward' | 'backward' | null>(null)
	const [participantCameras, setParticipantCameras] = useState<Record<string, boolean>>({})
	const [participantMicrophones, setParticipantMicrophones] = useState<Record<string, boolean>>({})

	const handlePlay = useCallback(
		({ time }: { time: number }) => {
			if (!videoRef.current || isSyncingRef.current) return

			isSyncingRef.current = true
			videoRef.current.seekTo(time, 'seconds')
			videoRef.current.getInternalPlayer().play()
			isSyncingRef.current = false
		},
		[videoRef]
	)

	const handlePause = useCallback(
		({ time }: { time: number }) => {
			if (!videoRef.current || isSyncingRef.current) return

			isSyncingRef.current = true
			videoRef.current.seekTo(time, 'seconds')
			videoRef.current.getInternalPlayer().pause()
			isSyncingRef.current = false
		},
		[videoRef]
	)

	const handleSeek = useCallback(
		({ time, direction }: { time: number; direction: 'forward' | 'backward' }) => {
			if (!videoRef.current || isSyncingRef.current) return

			isSyncingRef.current = true
			videoRef.current.seekTo(time, 'seconds')
			isSyncingRef.current = false

			setLastSeekDirection(direction)

			console.log('Received seek event:', { time, direction })
		},
		[videoRef]
	)

	const handleCameraSync = useCallback(
		({ socketId, isCameraDisabled }: { socketId: string; isCameraDisabled: boolean }) => {
			console.log('Received camera sync event:', { socketId, isCameraDisabled })
			setParticipantCameras(prev => ({
				...prev,
				[socketId]: isCameraDisabled,
			}))
		},
		[]
	)
	const handleMicrophoneSync = useCallback(
		({ socketId, isMicrophoneDisabled }: { socketId: string; isMicrophoneDisabled: boolean }) => {
			console.log('Received microphone sync event:', { socketId, isMicrophoneDisabled })
			setParticipantMicrophones(prev => ({
				...prev,
				[socketId]: isMicrophoneDisabled,
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

	useEffect(() => {
		socket.on(ACTIONS.VIDEO_PLAY, handlePlay)
		socket.on(ACTIONS.VIDEO_PAUSE, handlePause)
		socket.on(ACTIONS.VIDEO_SEEK, handleSeek)
		socket.on(ACTIONS.REQUEST_SYNC, handleSyncRequest)
		socket.on(ACTIONS.SYNC_CAMERA, handleCameraSync)
		socket.on(ACTIONS.SYNC_MICROPHONE, handleMicrophoneSync)

		return () => {
			socket.off(ACTIONS.VIDEO_PLAY, handlePlay)
			socket.off(ACTIONS.VIDEO_PAUSE, handlePause)
			socket.off(ACTIONS.VIDEO_SEEK, handleSeek)
			socket.off(ACTIONS.REQUEST_SYNC, handleSyncRequest)
			socket.off(ACTIONS.SYNC_CAMERA, handleCameraSync)
			socket.off(ACTIONS.SYNC_MICROPHONE, handleMicrophoneSync)
		}
	}, [handlePlay, handlePause, handleSeek, handleSyncRequest, handleCameraSync, handleMicrophoneSync])

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

	const emitCameraSync = useCallback(
		(isCameraDisabled: boolean) => {
			socket.emit(ACTIONS.SYNC_CAMERA, { roomID, socketId: socket.id, isCameraDisabled })
		},
		[roomID]
	)
	const emitMicrophoneSync = useCallback(
		(isMicrophoneDisabled: boolean) => {
			socket.emit(ACTIONS.SYNC_MICROPHONE, { roomID, socketId: socket.id, isMicrophoneDisabled })
		},
		[roomID]
	)

	return {
		emitPlay,
		emitPause,
		emitSeek,
		emitCameraSync,
		emitMicrophoneSync,
		requestSync,
		lastSeekDirection,
		participantCameras,
		participantMicrophones,
	}
}
