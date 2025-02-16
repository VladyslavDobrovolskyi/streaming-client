'use client'

import type React from 'react'
import { useState, useEffect, useRef } from 'react'
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
	isMicrophoneMuted: boolean
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
	isMicrophoneMuted,
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
	const [showVolumeControl, setShowVolumeControl] = useState(false)
	const [volumeBeforeMute, setVolumeBeforeMute] = useState(0)
	const [muted, setMuted] = useState(false)
	const [mutedBySlider, setMutedBySlider] = useState(false)
	const videoRef = useRef<HTMLVideoElement>(null)

	useEffect(() => {
		if (videoRef.current) {
			videoRef.current.volume = muted ? 0 : volume
			videoRef.current.muted = muted || isLocal || isMicrophoneMuted
		}
	}, [volume, muted, isLocal, isMicrophoneMuted])

	const handleToggleMuted = volume => {
		if (mutedBySlider) {
			setMuted(false)
			setMutedBySlider(false)
			onVolumeChange(clientID, 0.5) // Set volume to 50% when unmuting
			return
		}

		if (muted) {
			setMuted(false)
			onVolumeChange(clientID, volumeBeforeMute)
			return
		} else {
			setVolumeBeforeMute(volume)
			setMuted(true)
			onVolumeChange(clientID, 0)
			return
		}
	}

	const handleVolumeChange = (newVolume: number) => {
		if (newVolume === 0) {
			setMuted(true)
			setMutedBySlider(true)
		}
		onVolumeChange(clientID, newVolume)
	}

	const getVolumeIcon = (volume: number) => {
		const IconStyles = {
			color: 'white',
			transform: 'scale(0.5)',
		}

		if (muted || volume === 0) return <SpeakerOffIcon style={IconStyles} />
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
				zIndex: 12000,
				pointerEvents: 'auto',
			}}
			hide={isCameraMuted}
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
						zIndex: 11000,
					}}
					onMouseEnter={() => setHoveredClient(clientID)}
					onMouseLeave={() => {
						setHoveredClient(null)
						setShowVolumeControl(false)
					}}
				>
					<video
						width='100%'
						height='100%'
						ref={instance => {
							if (instance) {
								provideMediaRef(clientID, instance)
							}
						}}
						data-client-id={clientID}
						autoPlay
						playsInline
						className='video-drag-handle'
						style={{
							objectFit: 'cover',
							borderRadius: '5px',
							zIndex: 11001,
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
									zIndex: 11003,
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
										zIndex: 11003,
									}}
								>
									<div
										style={{
											position: 'relative',
											display: 'flex',
											alignItems: 'center',
										}}
										onMouseEnter={() => setShowVolumeControl(true)}
										onMouseLeave={() => setShowVolumeControl(false)}
									>
										<button
											onClick={() => handleToggleMuted(volume)}
											style={{
												color: 'white',
												border: 'none',
												padding: '0.5rem',
												borderRadius: '5px',
												cursor: 'pointer',
												background: 'none',
												display: 'flex',
												alignItems: 'center',
											}}
										>
											{getVolumeIcon(volume)}
										</button>
										{showVolumeControl && !muted && (
											<div
												style={{
													position: 'absolute',
													left: '100%',
													display: 'flex',
													alignItems: 'center',
													height: '100%',
												}}
											>
												<Slider
													orientation='horizontal'
													min={0}
													max={1}
													step={0.01}
													value={[volume]}
													onValueChange={value => handleVolumeChange(value[0])}
													style={
														{
															width: '100px',
															'--slider-thumb-size': '12px',
														} as React.CSSProperties
													}
												/>
											</div>
										)}
									</div>
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
								zIndex: 11004,
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
