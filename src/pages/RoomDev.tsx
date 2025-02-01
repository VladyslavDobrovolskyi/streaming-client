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
	const [previewTime, setPreviewTime] = useState<number | null>(null)
	const [isHoveringSlider, setIsHoveringSlider] = useState(false)
	const playerRef = useRef<ReactPlayer>(null)
	const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const playerWrapperRef = useRef<HTMLDivElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
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

	const handleProgress = (state: { played: number; loaded: number }) => {
		setPlayed(state.played)
		setLoaded(state.loaded)
	}

	const handlePreviewChange = (value: number[]) => {
		setPreviewTime(value[0])
		updatePreviewFrame(value[0])
	}

	const handleSeekChange = (value: number[]) => {
		const newTime = value[0]
		playerRef.current?.seekTo(newTime)
	}

	const handlePreviewMove = (e: React.MouseEvent<HTMLDivElement>) => {
		setIsHoveringSlider(true)
		if (sliderRef.current && playerRef.current) {
			const rect = sliderRef.current.getBoundingClientRect()
			const x = e.clientX - rect.left
			const fraction = x / rect.width
			const duration = playerRef.current.getDuration()
			const newPreviewTime = fraction * duration
			setPreviewTime(newPreviewTime)
			updatePreviewFrame(newPreviewTime)
		}
	}

	const updatePreviewFrame = (time: number) => {
		const player = playerRef.current?.getInternalPlayer() as HTMLVideoElement
		if (player && canvasRef.current) {
			const canvas = canvasRef.current
			const ctx = canvas.getContext('2d')
			if (ctx) {
				const currentTime = player.currentTime
				player.currentTime = time
				player.onseeked = () => {
					ctx.drawImage(player, 0, 0, canvas.width, canvas.height)
					player.currentTime = currentTime
					player.onseeked = null
				}
			}
		}
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
				<div ref={sliderRef} style={{ margin: '0.5rem', color: '#fff', flex: 1, position: 'relative' }}>
					{/* Слайдер для перемотки */}
					<Slider
						min={0}
						max={playerRef.current?.getDuration() || 1}
						step={0.01}
						value={[played * (playerRef.current?.getDuration() || 1)]}
						onValueChange={handleSeekChange}
						style={{ width: '100%' }}
					/>
					{/* Слайдер для предпросмотра */}
					<div
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: '100%',
							pointerEvents: 'none',
						}}
					>
						<Slider
							min={0}
							max={playerRef.current?.getDuration() || 1}
							step={0.01}
							value={[
								previewTime !== null ? previewTime : played * (playerRef.current?.getDuration() || 1),
							]}
							onValueChange={handlePreviewChange}
							style={{ width: '100%', opacity: 0 }}
						/>
					</div>
					<div
						style={{
							position: 'absolute',
							top: '-20px',
							left: 0,
							width: '100%',
							height: '40px',
							cursor: 'pointer',
						}}
						onMouseEnter={() => setIsHoveringSlider(true)}
						onMouseLeave={() => setIsHoveringSlider(false)}
						onMouseMove={handlePreviewMove}
					/>
					{isHoveringSlider && previewTime !== null && (
						<div
							style={{
								position: 'absolute',
								top: '-140px',
								left: `${(previewTime / (playerRef.current?.getDuration() || 1)) * 100}%`,
								transform: 'translateX(-50%)',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								background: 'rgba(0, 0, 0, 0.7)',
								borderRadius: '4px',
								padding: '4px',
							}}
						>
							<div style={{ border: '1px solid rgba(255, 255, 255, 0.5)' }}>
								<canvas ref={canvasRef} width={160} height={90} />
							</div>
							<div
								style={{
									color: 'white',
									fontSize: '12px',
									marginTop: '4px',
									padding: '2px 6px',
									background: 'rgba(0, 0, 0, 0.5)',
									borderRadius: '2px',
								}}
							>
								{formatTime(previewTime)}
							</div>
						</div>
					)}
				</div>
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
