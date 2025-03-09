import React from 'react'
import { GearIcon } from '@radix-ui/react-icons' // Adjust the import path as necessary

interface LoaderProps {
	isLoading: boolean
}

const Loader: React.FC<LoaderProps> = ({ isLoading }) => {
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: 'rgba(0, 0, 0, 0.2)',
				zIndex: 40,
			}}
		>
			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
				<GearIcon
					style={{
						width: '3rem',
						height: '3rem',
						animation: 'spin 1s linear infinite',
						transform: 'scale(1.5)',
						color: 'white',
					}}
				/>
				<p style={{ color: 'white', fontWeight: '500' }}>{isLoading ? 'Loading...' : 'Buffering...'}</p>
			</div>
		</div>
	)
}

export default Loader
