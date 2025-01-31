import { memo } from 'react'

import Btn from './Btn'
import FullscreenIcon from '../../../icons/fullscreen.svg'
import FullscreenExitIcon from '../../../icons/fullscreen-exit.svg'

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
