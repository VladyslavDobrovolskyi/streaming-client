import { forwardRef, useImperativeHandle, useRef } from 'react'
import ReactPlayer from 'react-player'

interface SyncedReactPlayerProps {
	url: string
	playing: boolean
	volume: number
	muted: boolean
	onPlay: () => void
	onPause: () => void
	onProgress: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void
	onDuration: (duration: number) => void
}

export interface SyncedReactPlayerRef {
	seekTo: (amount: number, type?: 'seconds' | 'fraction') => void
	getCurrentTime: () => number
	getDuration: () => number
}

const SyncedReactPlayer = forwardRef<SyncedReactPlayerRef, SyncedReactPlayerProps>((props, ref) => {
	const playerRef = useRef<ReactPlayer>(null)
	const videoRef = useRef<HTMLVideoElement>(null)

	useImperativeHandle(ref, () => ({
		seekTo: (amount, type) => {
			playerRef.current?.seekTo(amount, type)
		},
		getCurrentTime: () => {
			return playerRef.current?.getCurrentTime() || 0
		},
		getDuration: () => {
			return playerRef.current?.getDuration() || 0
		},
	}))

	return <ReactPlayer {...props} ref={playerRef} config={{ file: { attributes: { ref: videoRef } } }} />
})

export { SyncedReactPlayer }
