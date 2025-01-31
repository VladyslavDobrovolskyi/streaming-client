import React, { useState, useRef, useEffect } from 'react'
import ReactPlayer from 'react-player'
import './RoomDev.css'
export default function RoomDev() {
	const [isPlaying, setIsPlaying] = useState(false)
	const [volume, setVolume] = useState(0.8)
	const [muted, setMuted] = useState(false)
	const [playbackRate, setPlaybackRate] = useState(1.0)
	const [played, setPlayed] = useState(0)
	const [loaded, setLoaded] = useState(0)
	const playerRef = useRef<ReactPlayer>(null)

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

	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setVolume(parseFloat(e.target.value))
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

	const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		playerRef.current?.seekTo(parseFloat(e.target.value))
	}

	return (
		<div className={`player-wrapper ${isPlaying ? 'playing' : ''}`}>
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
			<div className='controls'>
				<button onClick={() => setIsPlaying(prev => !prev)}>{isPlaying ? 'Pause' : 'Play'}</button>
				<button onClick={handleToggleMuted}>{muted ? 'Unmute' : 'Mute'}</button>
				<label>
					Volume
					<input type='range' min={0} max={1} step='0.01' value={volume} onChange={handleVolumeChange} />
				</label>
				<label>
					Playback Rate
					<select value={playbackRate} onChange={e => handlePlaybackRateChange(parseFloat(e.target.value))}>
						<option value={0.5}>0.5x</option>
						<option value={0.75}>0.75x</option>
						<option value={1}>1x</option>
						<option value={1.25}>1.25x</option>
						<option value={1.5}>1.5x</option>
						<option value={2}>2x</option>
					</select>
				</label>
				<label>
					Seek
					<input type='range' min={0} max={1} step='0.01' value={played} onChange={handleSeekChange} />
				</label>
			</div>
		</div>
	)
}
