import type React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayIcon, PauseIcon, SpeakerOffIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from '@radix-ui/react-icons'

type ActionType = 'play' | 'pause' | 'mute' | 'forward' | 'backward'

interface ActionIndicatorProps {
	action: ActionType | null
}

const ActionIndicator: React.FC<ActionIndicatorProps> = ({ action }) => {
	const getIcon = () => {
		switch (action) {
			case 'play':
				return <PlayIcon className='w-32 h-32' />
			case 'pause':
				return <PauseIcon className='w-32 h-32' />
			case 'mute':
				return <SpeakerOffIcon className='w-32 h-32' />
			case 'forward':
				return <DoubleArrowRightIcon className='w-32 h-32' />
			case 'backward':
				return <DoubleArrowLeftIcon className='w-32 h-32' />
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
					className='bg-black bg-opacity-50 rounded-full p-4'
				>
					{getIcon()}
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export default ActionIndicator
