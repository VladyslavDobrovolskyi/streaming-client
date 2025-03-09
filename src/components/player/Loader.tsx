'use client'

import { useState } from 'react'
import ReactPlayer from 'react-player'
import { Loader2 } from 'lucide-react'

export default function VideoPlayerWithLoader() {
	const [isLoading, setIsLoading] = useState(true)
	const [isBuffering, setIsBuffering] = useState(false)

	const handleReady = () => {
		setIsLoading(false)
	}

	const handleBuffer = () => {
		setIsBuffering(true)
	}

	const handleBufferEnd = () => {
		setIsBuffering(false)
	}

	return (
		<div className='relative w-full h-full'>
			{/* Video Player */}
			<ReactPlayer
				url='/music/beat.mp4' // Your video URL
				width='100%'
				height='100%'
				onReady={handleReady}
				onBuffer={handleBuffer}
				onBufferEnd={handleBufferEnd}
				style={{
					backgroundColor: '#1a1a1a',
				}}
			/>

			{/* Loading Overlay */}
			{(isLoading || isBuffering) && (
				<div className='absolute inset-0 flex items-center justify-center bg-black/70 z-10'>
					<div className='flex flex-col items-center gap-3'>
						<Loader2 className='w-12 h-12 text-white animate-spin' />
						<p className='text-white font-medium'>{isLoading ? 'Loading video...' : 'Buffering...'}</p>
					</div>
				</div>
			)}
		</div>
	)
}
