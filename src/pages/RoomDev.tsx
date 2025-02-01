import { useState, useRef, useEffect, useCallback } from 'react'
import ReactPlayer from 'react-player'
import {
	PauseIcon,
	PlayIcon,
	SpeakerLoudIcon,
	SpeakerOffIcon,
	EnterFullScreenIcon,
	ExitFullScreenIcon,
} from '@radix-ui/react-icons'
import { Slider } from '@radix-ui/themes'

export default function RoomDev() {
	const [isPlaying, setIsPlaying] = useState(false)
	const [volume, setVolume] = useState(0.8)
	const [muted, setMuted] = useState(false)
	const [playbackRate, setPlaybackRate] = useState(1.0)
	const [played, setPlayed] = useState(0)
	const [loaded, setLoaded] = useState(0)
	const [showControls, setShowControls] = useState(false)
	const [showVolumeControl, setShowVolumeControl] = useState(false)
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [seekTime, setSeekTime] = useState<number | null>(null)
	const [isSeeking, setIsSeeking] = useState(false) // Added state for seeking
	const playerRef = useRef<ReactPlayer>(null)
	const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const playerWrapperRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (loaded) {
			console.log('loaded')
		}
	}, [loaded])

	const handlePlay = () => {
		setIsPlaying(true)
	}

	const handlePause = () => {
		setIsPlaying(false)
	}

	const handleVolumeChange = (value: number[]) => {
		setVolume(value[0])
	}

	const handleToggleMuted = () => {
		setMuted(prevMuted => !prevMuted)
	}

	const handlePlaybackRateChange = (rate: number) => {
		setPlaybackRate(rate)
	}

	const handleProgress = (state: { played: number; loaded: number }) => {
		setPlayed(state.played)
		setLoaded(state.loaded)
	}

	const handleSeekChange = (value: number[]) => {
		setSeekTime(value[0])
		setIsSeeking(true)
	}

	const handleSeekMouseUp = () => {
		if (seekTime !== null) {
			playerRef.current?.seekTo(seekTime)
		}
		setIsSeeking(false)
	}

	const showControlsHandler = useCallback(() => {
		setShowControls(true)
		if (controlsTimeoutRef.current) {
			clearTimeout(controlsTimeoutRef.current)
		}
		controlsTimeoutRef.current = setTimeout(() => {
			setShowControls(false)
		}, 3000)
	}, [])

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

	return (
		<div
			ref={playerWrapperRef}
			className={`player-wrapper ${isPlaying ? 'playing' : ''}`}
			onMouseMove={showControlsHandler}
			onMouseLeave={() => setShowControls(false)}
			style={{
				backgroundColor: isPlaying ? '#333' : '#000',
				width: '100%',
				height: '100%',
				position: 'relative',
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
				playbackRate={playbackRate}
				onPlay={handlePlay}
				onPause={handlePause}
				onProgress={handleProgress}
				width='100%'
				height='100%'
			/>
			<div
				className={`controls ${showControls ? 'visible' : 'hidden'}`}
				style={{
					position: 'absolute',
					bottom: '10px',
					left: '50%',
					transform: 'translateX(-50%)',
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					padding: '10px',
					borderRadius: '5px',
					transition: 'opacity 0.3s ease',
					opacity: showControls ? 1 : 0,
					width: '90%',
				}}
			>
				<button
					onClick={() => setIsPlaying(prev => !prev)}
					style={{
						margin: '0.5rem',
						color: '#fff',
						border: 'none',
						padding: '0.5rem 1rem',
						borderRadius: '5px',
						cursor: 'pointer',
						background: 'none',
					}}
				>
					{isPlaying ? <PauseIcon /> : <PlayIcon />}
				</button>
				<label style={{ margin: '0.5rem', color: '#fff', flex: 1, position: 'relative' }}>
					Seek
					<Slider
						min={0}
						max={playerRef.current?.getDuration() || 1}
						step={0.01}
						value={[seekTime !== null ? seekTime : played * (playerRef.current?.getDuration() || 1)]}
						onValueChange={handleSeekChange}
						onPointerUp={handleSeekMouseUp}
						style={{ width: '100%' }}
					/>
					{isSeeking && seekTime !== null && (
						<div
							style={{
								position: 'absolute',
								top: '-30px',
								left: `${(seekTime / (playerRef.current?.getDuration() || 1)) * 100}%`,
								transform: 'translateX(-50%)',
								background: 'rgba(0, 0, 0, 0.7)',
								color: 'white',
								padding: '2px 6px',
								borderRadius: '4px',
								fontSize: '12px',
							}}
						>
							{formatTime(seekTime)}
						</div>
					)}
				</label>
				<div
					style={{
						position: 'relative',
						margin: '0.5rem',
						color: '#fff',
						border: 'none',
						padding: '0.5rem 1rem',
						borderRadius: '5px',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						background: 'none',
					}}
					onMouseEnter={() => setShowVolumeControl(true)}
					onMouseLeave={() => setShowVolumeControl(false)}
					onClick={handleToggleMuted}
				>
					{muted ? <SpeakerOffIcon /> : <SpeakerLoudIcon />}
					{showVolumeControl && (
						<Slider
							min={0}
							max={1}
							step={0.01}
							value={[volume]}
							onValueChange={handleVolumeChange}
							style={{
								position: 'absolute',
								bottom: '100%',
								left: '50%',
								transform: 'translateX(-50%)',
								width: '100px',
							}}
						/>
					)}
				</div>
				<label style={{ margin: '0.5rem', color: '#fff' }}>
					Playback Rate
					<select
						value={playbackRate}
						onChange={e => handlePlaybackRateChange(Number.parseFloat(e.target.value))}
						style={{
							margin: '0.5rem',
							color: '#fff',
							border: 'none',
							padding: '0.5rem 1rem',
							borderRadius: '5px',
							cursor: 'pointer',
							background: 'none',
						}}
					>
						<option value={0.5}>0.5x</option>
						<option value={0.75}>0.75x</option>
						<option value={1}>1x</option>
						<option value={1.25}>1.25x</option>
						<option value={1.5}>1.5x</option>
						<option value={2}>2x</option>
					</select>
				</label>
				<button
					onClick={handleFullscreenToggle}
					style={{
						margin: '0.5rem',
						color: '#fff',
						border: 'none',
						padding: '0.5rem 1rem',
						borderRadius: '5px',
						cursor: 'pointer',
						background: 'none',
					}}
				>
					{isFullscreen ? <EnterFullScreenIcon /> : <ExitFullScreenIcon />}
				</button>
			</div>
		</div>
	)
}
