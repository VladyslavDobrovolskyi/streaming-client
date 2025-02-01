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
	const [duration, setDuration] = useState(300)
	const [isDragging, setIsDragging] = useState(false)
	const playerRef = useRef<ReactPlayer>(null)
	const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const playerWrapperRef = useRef<HTMLDivElement>(null)
	const sliderRef = useRef<HTMLDivElement>(null)

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
	}

	const handleSeekEnd = () => {
		setIsDragging(false)
		playerRef.current?.seekTo(played)
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
				onDuration={duration => setDuration(duration)}
				width='100%'
				height='100%'
			/>
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
					background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
					transition: 'opacity 0.3s ease',
					opacity: showControls ? 1 : 0,
				}}
			>
				<div
					ref={sliderRef}
					style={{
						margin: '0.5rem',
						color: '#fff',
						position: 'relative',
						height: '20px',
						cursor: 'pointer',
					}}
				>
					<Slider
						min={0}
						max={duration}
						step={0.01}
						value={[played * duration]}
						onValueChange={handleSeekChange}
						onPointerDown={handleSeekStart}
						onPointerUp={handleSeekEnd}
						style={
							{
								width: '100%',
								height: '100%',
								'--slider-thumb-size': '16px',
								'--slider-track-height': '8px',
							} as React.CSSProperties
						}
					/>
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							bottom: '-20px',
							display: 'flex',
							justifyContent: 'space-between',
						}}
					>
						<span>{formatTime(played * duration)}</span>
						<span>{formatTime(duration)}</span>
					</div>
				</div>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginTop: '20px',
					}}
				>
					<button
						onClick={() => setIsPlaying(prev => !prev)}
						style={{
							color: '#fff',
							border: 'none',
							padding: '0.5rem',
							borderRadius: '5px',
							cursor: 'pointer',
							background: 'none',
						}}
					>
						{isPlaying ? <PauseIcon /> : <PlayIcon />}
					</button>
					<div
						style={{
							position: 'relative',
							color: '#fff',
							display: 'flex',
							alignItems: 'center',
						}}
						onMouseEnter={() => setShowVolumeControl(true)}
						onMouseLeave={() => setShowVolumeControl(false)}
					>
						<button
							onClick={handleToggleMuted}
							style={{
								color: '#fff',
								border: 'none',
								padding: '0.5rem',
								borderRadius: '5px',
								cursor: 'pointer',
								background: 'none',
							}}
						>
							{muted ? <SpeakerOffIcon /> : <SpeakerLoudIcon />}
						</button>
						{showVolumeControl && (
							<Slider
								min={0}
								max={1}
								step={0.01}
								value={[volume]}
								onValueChange={handleVolumeChange}
								style={{
									width: '100px',
									marginLeft: '10px',
								}}
							/>
						)}
					</div>
					<select
						value={playbackRate}
						onChange={e => handlePlaybackRateChange(Number.parseFloat(e.target.value))}
						style={{
							color: '#fff',
							border: 'none',
							padding: '0.5rem',
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
					<button
						onClick={handleFullscreenToggle}
						style={{
							color: '#fff',
							border: 'none',
							padding: '0.5rem',
							borderRadius: '5px',
							cursor: 'pointer',
							background: 'none',
						}}
					>
						{isFullscreen ? <ExitFullScreenIcon /> : <EnterFullScreenIcon />}
					</button>
				</div>
			</div>
		</div>
	)
}
