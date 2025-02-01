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
	const [duration, setDuration] = useState(300) // 5 минут (300 секунд) по умолчанию
	const [previewTime, setPreviewTime] = useState<number | null>(null)
	const [isHoveringSlider, setIsHoveringSlider] = useState(false)
	const playerRef = useRef<ReactPlayer>(null)
	const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const playerWrapperRef = useRef<HTMLDivElement>(null)
	const sliderRef = useRef<HTMLDivElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [isDragging, setIsDragging] = useState(false)

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
		setPlayed(state.played)
		setLoaded(state.loaded)
		if (state.loadedSeconds > 0 && duration === 300) {
			setDuration(playerRef.current?.getDuration() || 300)
		}
	}

	const handleSeekStart = () => {
		setIsDragging(true)
	}
	
	const handleSeekEnd = () => {
		if (isDragging && previewTime !== null) {
			playerRef.current?.seekTo(previewTime / duration)
			setPlayed(previewTime / duration)
		}
		setIsDragging(false)
		setPreviewTime(null)
	}
	

	const handleSeekChange = (value: number[]) => {
		if (isDragging) {
			setPreviewTime(value[0])
		}
	}

	const handlePreviewMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (sliderRef.current && playerRef.current) {
			const rect = sliderRef.current.getBoundingClientRect()
			const x = e.clientX - rect.left
			const fraction = x / rect.width
			const newPreviewTime = fraction * duration
			//setPreviewTime(newPreviewTime)
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
				onDuration={duration => setDuration(duration)}
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
					<Slider
						min={0}
						max={duration}
						step={0.01}
						value={[played * duration]}
						onValueCommit={handleSeekChange}
						onPointerDown={handleSeekStart}   // При нажатии ЛКМ
    					onPointerUp={handleSeekEnd}       // Когда ЛКМ отпустили
    					onPointerLeave={handleSeekEnd}    // Если курсор вышел
						style={{ width: '100%' }}
					/>
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
								left: `${(previewTime / duration) * 100}%`,
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
					<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
						<span>{formatTime(played * duration)}</span>
						<span>{formatTime(duration)}</span>
					</div>
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
