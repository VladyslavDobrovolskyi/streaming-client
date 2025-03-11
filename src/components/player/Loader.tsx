import React from 'react'
import { GearIcon } from '@radix-ui/react-icons' // Adjust the import path as necessary

const Loader: React.FC = () => {
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
				zIndex: 999998,
			}}
		>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: '0.75rem',
					transform: 'scale(1.5)',
					zIndex: 999999,
				}}
			>
				<GearIcon
					style={{
						width: '3rem',
						height: '3rem',
						animation: 'spin 1s linear infinite',
						transform: 'scale(4)',
						color: 'white',
						zIndex: 999999,
					}}
				/>
				{/* <p style={{ color: 'white', fontWeight: '500' }}>{isLoading ? 'Loading...' : 'Buffering...'}</p> */}
			</div>
		</div>
	)
}

export default Loader
