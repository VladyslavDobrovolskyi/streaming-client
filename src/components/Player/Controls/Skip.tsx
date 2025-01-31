import { memo } from 'react'
import Btn from './Btn'
import { FastForward as TrackSkipIcon } from '@geist-ui/icons'

interface SkipProps {
	onSkip: () => void
}

const Skip: React.FC<SkipProps> = ({ onSkip }) => {
	return (
		<Btn label='+ 10 seconds' onClick={onSkip}>
			<TrackSkipIcon />
		</Btn>
	)
}

export default memo(Skip)
