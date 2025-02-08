'use client'

import type React from 'react'
import { useState } from 'react'
import DraggableResizable from './DraggableResizable'
import {
	EyeOpenIcon,
	EyeClosedIcon,
	SpeakerOffIcon,
	SpeakerQuietIcon,
	SpeakerModerateIcon,
	SpeakerLoudIcon,
} from '@radix-ui/react-icons'
import { Slider } from '@radix-ui/themes'

interface ClientVideoProps {
	clientID: string
	provideMediaRef: (clientID: string, instance: HTMLVideoElement | null) => Promise<void>
	isLocal: boolean
	username: string
	isCameraMuted: boolean
	position: { x: number; y: number }
	size: { width: number; height: number; scale?: number }
	onPositionChange: (clientID: string, position: { x: number; y: number }) => void
	onSizeChange: (clientID: string, size: { width: number; height: number; scale?: number }) => void
	onVolumeChange: (clientID: string, volume: number) => void
	onCoverToggle: (clientID: string) => void
	isCovered: boolean
	volume: number
	highlightedUser: string | null
}

export default function ClientVideo({
	clientID,
	provideMediaRef,
	isLocal,
	isCameraMuted,
	position,
	size,
	onPositionChange,
	onSizeChange,
	onVolumeChange,
	onCoverToggle,
	isCovered,
	volume,
	highlightedUser,
}: ClientVideoProps) {
	const [hoveredClient, setHoveredClient] = useState<string | null>(null)

	const getVolumeIcon = (volume: number) => {
		const IconStyles = {
			color: 'white',
			transform: 'scale(0.5)',
		}

		if (volume === 0) return <SpeakerOffIcon style={IconStyles} />
		if (volume < 0.33) return <SpeakerQuietIcon style={IconStyles} />
		if (volume < 0.66) return <SpeakerModerateIcon style={IconStyles} />
		return <SpeakerLoudIcon style={IconStyles} />
	}

	return (
		<DraggableResizable
			initialSize={{ width: size.width, height: size.height }}
			initialPosition={position}
			bounds='parent'
			minConstraints={[100, 75]}
			maxConstraints={[300, 200]}
			onPositionChange={newPosition => onPositionChange(clientID, newPosition)}
			onSizeChange={newSize => onSizeChange(clientID, { ...newSize, scale: size.scale || 1 })}
			dragHandleClassName='video-drag-handle'
			resizeHandleStyles={{
				position: 'absolute',
				zIndex: 10,
			}}
		>
			{({ isDragging }) => (
				<div
					style={{
						width: '100%',
						height: '100%',
						position: 'relative',
						pointerEvents: 'auto',
						transition: 'all 0.1s ease-out',
						cursor: 'default',
						display: isCameraMuted ? 'none' : 'block',
						border: highlightedUser === clientID ? '3px solid cyan' : 'none',
						boxShadow: highlightedUser === clientID ? '0 0 10px cyan' : 'none',
						transform: `scale(${size.scale || 1})`,
						transformOrigin: 'center center',
					}}
					onMouseEnter={() => setHoveredClient(clientID)}
					onMouseLeave={() => setHoveredClient(null)}
				>
					<video
						className='video-drag-handle'
						width='100%'
						height='100%'
						ref={instance => provideMediaRef(clientID, instance)}
						data-client-id={clientID}
						autoPlay
						playsInline
						muted={isLocal}
						style={{
							objectFit: 'cover',
							borderRadius: '5px',
							cursor: isDragging ? 'grabbing' : 'move',
						}}
					/>
					{hoveredClient === clientID && (
						<>
							<div
								style={{
									position: 'absolute',
									top: '50%',
									left: '50%',
									transform: 'translate(-50%, -50%)',
									cursor: 'pointer',
									pointerEvents: 'auto',
									zIndex: 5,
								}}
								onClick={() => onCoverToggle(clientID)}
							>
								<EyeOpenIcon style={{ color: 'white', transform: 'scale(1)' }} />
							</div>
							{!isLocal && (
								<div
									style={{
										position: 'absolute',
										bottom: '5px',
										left: '5px',
										right: '5px',
										display: 'flex',
										alignItems: 'center',
										pointerEvents: 'auto',
										zIndex: 5,
									}}
								>
									<button
										onClick={() => onVolumeChange(clientID, volume === 0 ? 1 : 0)}
										style={{
											background: 'none',
											border: 'none',
											cursor: 'pointer',
											padding: 0,
											display: 'flex',
											alignItems: 'center',
										}}
									>
										{getVolumeIcon(volume)}
									</button>

									{volume !== 0 && (
										<Slider
											orientation='horizontal'
											min={0.0}
											max={1.0}
											step={0.01}
											value={[volume]}
											onValueChange={value => onVolumeChange(clientID, value[0])}
											style={
												{
													cursor: 'pointer',
													width: '100%',
													marginLeft: '5px',
													'--slider-thumb-size': '10px',
													'--slider-track-height': '2px',
												} as React.CSSProperties
											}
										/>
									)}
								</div>
							)}
						</>
					)}
					{isCovered && (
						<div
							onClick={() => onCoverToggle(clientID)}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: '100%',
								backgroundColor: 'black',
								borderRadius: '5px',
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								pointerEvents: 'auto',
								zIndex: 4,
							}}
						>
							<EyeClosedIcon style={{ color: 'white', transform: 'scale(1)', cursor: 'pointer' }} />
						</div>
					)}
				</div>
			)}
		</DraggableResizable>
	)
}
