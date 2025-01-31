import Btn from './Btn'
import { Circle as PipInIcon, Circle as PipOutIcon } from '@geist-ui/icons'

interface PipProps {
	isPipMode: boolean
	onToggle: () => void
}

const Pip: React.FC<PipProps> = ({ isPipMode, onToggle }) => {
	return (
		<Btn label='Picture in Picture' onClick={onToggle}>
			{isPipMode ? <PipOutIcon /> : <PipInIcon />}
		</Btn>
	)
}

export default Pip
