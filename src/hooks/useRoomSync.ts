import { useEffect, useRef, useCallback, useState } from 'react'
import socket from '../socket'
import ACTIONS from '../socket/actions'
import type ReactPlayer from 'react-player'

export default function useRoomSync(roomID: string, videoRef: React.RefObject<ReactPlayer>) {
	const isSyncingRef = useRef(false)
	const [lastSeekDirection, setLastSeekDirection] = useState<'forward' | 'backward' | null>(null)

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
		},
		[videoRef]
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

		return () => {
			socket.off(ACTIONS.VIDEO_PLAY, handlePlay)
			socket.off(ACTIONS.VIDEO_PAUSE, handlePause)
			socket.off(ACTIONS.VIDEO_SEEK, handleSeek)
			socket.off(ACTIONS.REQUEST_SYNC, handleSyncRequest)
		}
	}, [handlePlay, handlePause, handleSeek, handleSyncRequest])

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

	return { emitPlay, emitPause, emitSeek, requestSync, lastSeekDirection }
}
