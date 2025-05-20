import React from 'react'
import { GearIcon } from '@radix-ui/react-icons' // Adjust the import path as necessary

interface LoaderProps {
	color?: string
}
const Loader: React.FC<LoaderProps> = ({ color = 'white' }) => {
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: 'rgba(0, 0, 0, 0.3)',
				backdropFilter: 'blur(4px)',
				zIndex: 2147483610,
			}}
		>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: '0.75rem',
					transform: 'scale(1.5)',
					zIndex: 2147483650,
				}}
			>
				<GearIcon
					style={{
						width: '3rem',
						height: '3rem',
						animation: 'spin 1s linear infinite',
						transform: 'scale(4)',
						color: color,
						zIndex: 2147483647,
					}}
				/>
				{/* <p style={{ color: 'white', fontWeight: '500' }}>{isLoading ? 'Loading...' : 'Buffering...'}</p> */}
			</div>
		</div>
	)
}

export default Loader
