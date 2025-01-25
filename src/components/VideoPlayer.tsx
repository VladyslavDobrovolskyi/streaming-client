import React from 'react'
import ReactPlayer from 'react-player'
import styles from './VideoPlayer.module.css'

interface VideoPlayerProps {
	url: string
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url }) => {
	return (
		<div className={styles.videoPlayer}>
			<ReactPlayer
				className={styles.reactPlayer}
				url={url}
				controls={false} // Отключаем элементы управления
				width='100%'
				height='auto'
			/>
		</div>
	)
}

export default VideoPlayer
