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
	GearIcon,
	CircleIcon,
} from '@radix-ui/react-icons'
import { Slider, Text } from '@radix-ui/themes'

export default function RoomDev() {
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
	const playerRef = useRef<ReactPlayer>(null)
	const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const playerWrapperRef = useRef<HTMLDivElement>(null)
	const sliderRef = useRef<HTMLDivElement>(null)
	const previousVolumeRef = useRef(volume)

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

	const handleForward15 = () => {
		const newTime = Math.min(played + 15 / duration, 1)
		setPlayed(newTime)
		playerRef.current?.seekTo(newTime)
	}

	const handleBackward15 = () => {
		const newTime = Math.max(played - 15 / duration, 0)
		setPlayed(newTime)
		playerRef.current?.seekTo(newTime)
	}
	const handleVolumeChange = (value: number[]) => {
		const newVolume = value[0]
		if (newVolume === 0) {
			setMuted(true)
			setMutedBySlider(true)
			setVolume(0.5)
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
				// Unmuting
				if (mutedBySlider) {
					setVolume(0.5)
					setMutedBySlider(false)
				} else {
					setVolume(previousVolumeRef.current > 0 ? previousVolumeRef.current : 0.5)
				}
				return false
			} else {
				// Muting
				previousVolumeRef.current = volume
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
		playerRef.current?.seekTo(played)
		showControlsHandler()
	}

	const showControlsHandler = useCallback(() => {
		setShowControls(true)
		if (controlsTimeoutRef.current) {
			clearTimeout(controlsTimeoutRef.current)
		}
		if (!isDragging) {
			controlsTimeoutRef.current = setTimeout(() => {
				setShowControls(false)
			}, 3000)
		}
	}, [isDragging])

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

	return (
		<div
			ref={playerWrapperRef}
			className={`player-wrapper ${isPlaying ? 'playing' : ''}`}
			onMouseMove={showControlsHandler}
			onMouseLeave={() => !isDragging && setShowControls(false)}
			style={{
				backgroundColor: '#1a1a1a',
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
				onPlay={handlePlay}
				onPause={handlePause}
				onProgress={handleProgress}
				onDuration={duration => setDuration(duration)}
				width='100%'
				height='100%'
				style={{ backgroundColor: '#1a1a1a' }}
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
					background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
					transition: 'opacity 0.3s ease',
					opacity: showControls ? 1 : 0,
				}}
			>
				{/* Progress bar */}
				<div
					ref={sliderRef}
					style={{
						margin: '0 0.5rem',
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
								'--slider-thumb-size': '12px',
								'--slider-track-height': '4px',
							} as React.CSSProperties
						}
					/>
				</div>

				{/* Controls bar */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '0 0.5rem',
					}}
				>
					{/* Left controls group */}
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<button
							onClick={() => setIsPlaying(prev => !prev)}
							style={{
								color: '#fff',
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
								color: '#fff',
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
								color: '#fff',
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
									color: '#fff',
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
										value={[volume]}
										onValueChange={handleVolumeChange}
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

					{/* Center time display */}
					<Text size='5' as='span' style={{ color: 'white' }}>
						{formatTime(played * duration)} / {formatTime(duration)}
					</Text>

					{/* Right controls group */}
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<button
							style={{
								color: '#fff',
								border: 'none',
								padding: '0.5rem',
								borderRadius: '5px',
								cursor: 'pointer',
								background: 'none',
								display: 'flex',
								alignItems: 'center',
							}}
						>
							<GearIcon />
						</button>
						<button
							style={{
								color: '#fff',
								border: 'none',
								padding: '0.5rem',
								borderRadius: '5px',
								cursor: 'pointer',
								background: 'none',
								display: 'flex',
								alignItems: 'center',
							}}
						>
							<CircleIcon />
						</button>
						<button
							onClick={handleFullscreenToggle}
							style={{
								color: '#fff',
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
						<span
							style={{
								color: '#fff',
								fontSize: '14px',
								padding: '2px 6px',
								border: '1px solid #fff',
								borderRadius: '4px',
							}}
						>
							HD
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}
