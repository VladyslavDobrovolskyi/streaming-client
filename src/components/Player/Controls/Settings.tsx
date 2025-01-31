import { memo } from 'react'
import Btn from './Btn'
import { Settings as SettingIcon } from '@geist-ui/icons'

interface SettingsProps {
	onToggle: () => void
}

const Settings: React.FC<SettingsProps> = ({ onToggle }) => {
	return (
		<Btn label='Settings' onClick={onToggle}>
			<SettingIcon />
		</Btn>
	)
}

export default memo(Settings)
