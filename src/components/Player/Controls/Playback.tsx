import { memo } from 'react'
import Btn from './Btn'
import { Play as PlayIcon, Pause as PauseIcon } from '@geist-ui/icons'

interface PlaybackProps {
	isPlaying: boolean
	onToggle: () => void
}

const Playback: React.FC<PlaybackProps> = ({ isPlaying, onToggle }) => (
	<Btn label={isPlaying ? 'Pause' : 'Play'} onClick={onToggle}>
		{isPlaying ? <PauseIcon /> : <PlayIcon />}
	</Btn>
)

export default memo(Playback)
