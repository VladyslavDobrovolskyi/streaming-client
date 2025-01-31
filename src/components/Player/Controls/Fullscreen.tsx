import { memo } from 'react'
import Btn from './Btn'
import { FullScreen as FullscreenIcon, FullScreenClose as FullscreenExitIcon } from '@geist-ui/icons'

interface FullscreenProps {
	isFullscreen: boolean
	onToggle: () => void
}

const Fullscreen: React.FC<FullscreenProps> = ({ isFullscreen, onToggle }) => (
	<Btn label={isFullscreen ? 'Fullscreen Off' : 'Fullscreen'} onClick={onToggle}>
		{!isFullscreen && <FullscreenIcon />}
		{isFullscreen && <FullscreenExitIcon />}
	</Btn>
)

export default memo(Fullscreen)
