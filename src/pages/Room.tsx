import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import useWebRTC, { LOCAL_VIDEO } from '../hooks/useWebRTC'

function layout(clientsNumber = 1) {
	const pairs = Array.from({ length: clientsNumber }).reduce((acc: [number, number?][], _next, index, arr) => {
		if (index % 2 === 0) {
			acc.push([index, index + 1 < arr.length ? index + 1 : undefined])
		}
		return acc
	}, [])

	const rowsNumber = pairs.length
	const height = `${100 / rowsNumber}%`

	return pairs
		.map((row, index, arr) => {
			if (index === arr.length - 1 && row.length === 1) {
				return [
					{
						width: '100%',
						height,
					},
				]
			}

			return row.map(() => ({
				width: '50%',
				height,
			}))
		})
		.flat()
}

export default function Room() {
	const { id: roomID } = useParams()
	const { clients, provideMediaRef } = useWebRTC(roomID)
	const videoLayout = layout(clients.length)
	const videoRef = useRef<HTMLVideoElement>(null)
	const [isPlaying, setIsPlaying] = useState(false)
	const [isMuted, setIsMuted] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const checkStreamAvailability = async () => {
		try {
			const response = await fetch('/movie')
			if (!response.ok) {
				setError('Movie is currently unavailable')
				return
			}

			if (videoRef.current) {
				const mediaElement = videoRef.current
				mediaElement.src = '/movie'
				mediaElement.load()
				mediaElement.play().catch(error => console.error('Playback error:', error))
				setIsPlaying(true)
			}
		} catch {
			setError('An error occurred while fetching the movie')
		}
	}

	useEffect(() => {
		checkStreamAvailability()
	}, [])

	const handlePlayPause = () => {
		if (videoRef.current) {
			const mediaElement = videoRef.current
			if (mediaElement.paused) {
				mediaElement.play().catch(error => console.error('Play error:', error))
				setIsPlaying(true)
			} else {
				mediaElement.pause()
				setIsPlaying(false)
			}
		}
	}

	const handleMuteUnmute = () => {
		if (videoRef.current) {
			const mediaElement = videoRef.current
			mediaElement.muted = !mediaElement.muted
			setIsMuted(mediaElement.muted)
		}
	}

	if (error) {
		return (
			<div className='Room'>
				<h1>{error}</h1>
			</div>
		)
	}

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexWrap: 'wrap',
				height: '100vh',
			}}
		>
			{clients.map((clientID, index) => (
				<div key={clientID} style={videoLayout[index]} id={clientID}>
					<video
						width='100%'
						height='100%'
						ref={instance => provideMediaRef(clientID, instance)}
						autoPlay
						playsInline
						muted={clientID === LOCAL_VIDEO}
					/>
				</div>
			))}
			<div style={{ width: '100%', height: 'auto', marginTop: '20px' }}>
				<video
					ref={videoRef}
					width='100%'
					height='auto'
					controls={false}
					muted={isMuted}
					playsInline
					onPlay={() => setIsPlaying(true)}
					onPause={() => setIsPlaying(false)}
					style={{ cursor: 'pointer', backgroundColor: '#000' }}
					onClick={handlePlayPause}
				/>
				<div style={{ marginTop: '10px' }}>
					<button onClick={handlePlayPause} style={{ padding: '10px 20px', fontSize: '16px' }}>
						{isPlaying ? 'Pause' : 'Play'}
					</button>
					<button
						onClick={handleMuteUnmute}
						style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}
					>
						{isMuted ? 'Unmute' : 'Mute'}
					</button>
				</div>
			</div>
		</div>
	)
}
