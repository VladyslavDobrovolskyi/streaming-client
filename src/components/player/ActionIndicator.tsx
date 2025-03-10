import type React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	PlayIcon,
	PauseIcon,
	SpeakerOffIcon,
	DoubleArrowLeftIcon,
	DoubleArrowRightIcon,
	SpeakerLoudIcon,
	SpeakerQuietIcon,
	SpeakerModerateIcon,
} from '@radix-ui/react-icons'

type ActionType = 'play' | 'pause' | 'mute' | 'unmute' | 'forward' | 'backward' | 'volume'

interface ActionIndicatorProps {
	action: ActionType | null
	volume: number
}

const ActionIndicator: React.FC<ActionIndicatorProps> = ({ action, volume }) => {
	const getIcon = () => {
		const iconStyle = { transform: 'scale(2.5)', color: 'white', opacity: '0.8' }
		switch (action) {
			case 'play':
				return <PlayIcon style={iconStyle} />
			case 'pause':
				return <PauseIcon style={iconStyle} />
			case 'mute':
				return <SpeakerOffIcon style={iconStyle} />
			case 'unmute':
			case 'volume':
				if (volume === 0) return <SpeakerOffIcon style={iconStyle} />
				if (volume < 0.25) return <SpeakerQuietIcon style={iconStyle} />
				if (volume < 0.75) return <SpeakerModerateIcon style={iconStyle} />
				return <SpeakerLoudIcon style={iconStyle} />
			case 'forward':
				return <DoubleArrowRightIcon style={iconStyle} />
			case 'backward':
				return <DoubleArrowLeftIcon style={iconStyle} />
			default:
				return null
		}
	}

	return (
		<AnimatePresence>
			{action && (
				<motion.div
					initial={{ opacity: 0, scale: 0.5 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.5 }}
					transition={{ duration: 0.3 }}
					className='bg-black bg-opacity-50 rounded-full p-12'
				>
					{getIcon()}
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export default ActionIndicator
