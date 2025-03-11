'use client'

import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DraggableResizable from '../DraggableResizable'
import {
	EyeOpenIcon,
	EyeClosedIcon,
	SpeakerOffIcon,
	SpeakerQuietIcon,
	SpeakerModerateIcon,
	SpeakerLoudIcon,
} from '@radix-ui/react-icons'
import { Slider } from '@radix-ui/themes'

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
	participantVolume,
	onCoverToggle,
	isCovered,
	volume,
	highlightedUser,
	onMouseEnter,
	onMouseLeave,
	toggleCamera,
	cameraStatus,
	setHideMe,
}) {
	const [hoveredClient, setHoveredClient] = useState<string | null>(null)
	const [volumeBeforeMute, setVolumeBeforeMute] = useState(0)
	const [muted, setMuted] = useState(false)
	const [mutedBySlider, setMutedBySlider] = useState(false)
	const videoRef = useRef<HTMLVideoElement>(null)
	const DEFAULT_VOLUME = 0.5

	// Helper function to get effective volume
	const getEffectiveVolume = () => {
		if (participantVolume && clientID in participantVolume) {
			return participantVolume[clientID]
		}
		if (volume !== undefined && volume !== null && volume > 0) {
			return volume
		}
		return DEFAULT_VOLUME // Default fallback
	}

	// This effect runs once when the component mounts to connect the videoRef to provideMediaRef
	useEffect(() => {
		if (videoRef.current) {
			provideMediaRef(clientID, videoRef.current)
		}

		// Cleanup function to handle unmounting
		return () => {
			provideMediaRef(clientID, null)
		}
	}, [clientID, provideMediaRef])

	// Initialize new users with default volume
	useEffect(() => {
		// If this client doesn't have a volume set in participantVolume, initialize it
		if (participantVolume && !(clientID in participantVolume)) {
			// Always ensure new users have a non-zero volume
			// If volume prop is greater than 0, use it, otherwise use DEFAULT_VOLUME
			const initialVolume = volume !== undefined && volume !== null && volume > 0 ? volume : DEFAULT_VOLUME

			console.log(`Initializing volume for ${clientID} to ${initialVolume}`)
			onVolumeChange(clientID, initialVolume)

			// Ensure muted state is false for new users
			setMuted(false)

			// Directly update the video element if it exists
			if (videoRef.current) {
				videoRef.current.volume = initialVolume
				videoRef.current.muted = isLocal || isMicrophoneMuted
			}
		}
	}, [clientID, participantVolume, onVolumeChange, volume, isLocal, isMicrophoneMuted])

	useEffect(() => {
		if (videoRef.current) {
			// Get effective volume
			const effectiveVolume = getEffectiveVolume()

			// Set muted state based on volume
			setMuted(effectiveVolume === 0)

			// Apply volume and muted state to video element
			videoRef.current.volume = effectiveVolume
			videoRef.current.muted = effectiveVolume === 0 || isLocal || isMicrophoneMuted

			console.log(
				`Setting video element: volume=${effectiveVolume}, muted=${
					effectiveVolume === 0 || isLocal || isMicrophoneMuted
				}`
			)
		}
	}, [volume, participantVolume, clientID, isLocal, isMicrophoneMuted])

	useEffect(() => {
		// This effect specifically handles changes to participantVolume
		if (participantVolume && clientID in participantVolume) {
			const newVolume = participantVolume[clientID]
			console.log(`ClientVideo: Volume for ${clientID} changed to ${newVolume}`)

			// Update muted state based on participantVolume
			setMuted(newVolume === 0)

			// Update video element directly
			if (videoRef.current) {
				videoRef.current.volume = newVolume
				videoRef.current.muted = newVolume === 0 || isLocal || isMicrophoneMuted
				console.log(
					`Updated video ref: volume=${newVolume}, muted=${newVolume === 0 || isLocal || isMicrophoneMuted}`
				)
			}
		}
	}, [participantVolume, clientID, isLocal, isMicrophoneMuted])

	// Add this new useEffect to handle the isCovered state
	useEffect(() => {
		if (isCovered) {
			// When covered, set volume to 0 in participantVolume
			onVolumeChange(clientID, 0)
			setMuted(true)

			// Directly mute the video element
			if (videoRef.current) {
				videoRef.current.muted = true
			}
		}
	}, [isCovered, clientID, onVolumeChange])

	const handleToggleMuted = () => {
		console.log(`handleToggleMuted called, current muted state: ${muted}`)

		if (mutedBySlider) {
			setMuted(false)
			setMutedBySlider(false)
			onVolumeChange(clientID, DEFAULT_VOLUME) // Update participantVolume
			console.log(`Unmuting from slider: setting volume to ${DEFAULT_VOLUME}`)

			// Directly update the video element
			if (videoRef.current) {
				videoRef.current.volume = DEFAULT_VOLUME
				videoRef.current.muted = isLocal || isMicrophoneMuted
			}
			return
		}

		if (muted) {
			// Unmuting - update participantVolume
			const newVolume = volumeBeforeMute > 0 ? volumeBeforeMute : DEFAULT_VOLUME
			console.log(`Unmuting: setting volume to ${newVolume}`)
			onVolumeChange(clientID, newVolume) // This updates participantVolume

			// Directly update the video element
			if (videoRef.current) {
				videoRef.current.volume = newVolume
				videoRef.current.muted = isLocal || isMicrophoneMuted
			}
		} else {
			// Muting - save current volume and update participantVolume
			const currentVolume = getEffectiveVolume()
			setVolumeBeforeMute(currentVolume > 0 ? currentVolume : DEFAULT_VOLUME)
			console.log(`Muting: saving volume ${currentVolume > 0 ? currentVolume : DEFAULT_VOLUME} and setting to 0`)
			onVolumeChange(clientID, 0) // This updates participantVolume

			// Directly update the video element
			if (videoRef.current) {
				videoRef.current.muted = true
			}
		}
	}

	const handleVolumeChange = (newVolume: number) => {
		if (newVolume === 0) {
			setMuted(true)
			setMutedBySlider(true)

			// Directly mute the video element
			if (videoRef.current) {
				videoRef.current.muted = true
			}
		} else {
			setMuted(false)
			setMutedBySlider(false)

			// Directly update the video element
			if (videoRef.current) {
				videoRef.current.volume = newVolume
				videoRef.current.muted = isLocal || isMicrophoneMuted
			}
		}
		onVolumeChange(clientID, newVolume) // This updates participantVolume
	}

	const getVolumeIcon = () => {
		const IconStyles = {
			color: 'white',
			transform: 'scale(0.6)',
		}

		// Get effective volume
		const effectiveVolume = getEffectiveVolume()

		if (muted || effectiveVolume === 0) return <SpeakerOffIcon style={IconStyles} />
		if (effectiveVolume < 0.33) return <SpeakerQuietIcon style={IconStyles} />
		if (effectiveVolume < 0.66) return <SpeakerModerateIcon style={IconStyles} />
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
			hide={isCameraMuted || cameraStatus === false}
		>
			{({ isDragging }) => (
				<div
					style={{
						width: '100%',
						height: '100%',
						position: 'relative',
						pointerEvents: 'auto',
						transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
						cursor: 'default',
						display: isCameraMuted ? 'none' : 'block',
						border:
							highlightedUser === clientID
								? '3px solid var(--accent-color-main'
								: '3px solid transparent',
						boxShadow: highlightedUser === clientID ? '0 0 10px cyan' : 'none',
						borderRadius: 'var(--radius-4)',
						transform: `scale(${size.scale || 1})`,
						transformOrigin: 'center center',
						zIndex: 11000,
					}}
					onMouseEnter={() => {
						setHoveredClient(clientID)
						onMouseEnter(clientID)
					}}
					onMouseLeave={() => {
						setHoveredClient(null)
						onMouseLeave()
					}}
				>
					<video
						width='100%'
						height='100%'
						ref={videoRef}
						data-client-id={clientID}
						autoPlay
						playsInline
						className='video-drag-handle'
						style={{
							objectFit: 'cover',
							borderRadius: 'var(--radius-4)',
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
							>
								<motion.div
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									whileHover={{ scale: 1.2 }}
									whileTap={{ scale: 0.9 }}
									transition={{ type: 'spring', stiffness: 400, damping: 17 }}
								>
									<EyeOpenIcon
										style={{ color: 'white', transform: 'scale(1)' }}
										onClick={() => {
											toggleCamera(clientID)
											if (isLocal) {
												setHideMe(true)
											}
										}}
									/>
								</motion.div>
							</div>
							{!isLocal && (
								<div
									style={{
										position: 'absolute',
										bottom: '-10px',
										left: '-11px',
										right: '0px',
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
									>
										<button
											onClick={handleToggleMuted}
											style={{
												color: 'white',
												border: 'none',
												padding: '0.5rem',
												borderRadius: 'var(--radius-4)',
												cursor: 'pointer',
												background: 'none',
												display: 'flex',
												alignItems: 'center',
											}}
											onMouseOver={e => (e.currentTarget.style.transform = 'scale(1)')}
											onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
											onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
											onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.4)')}
										>
											{getVolumeIcon()}
										</button>
										{!muted && (
											<div
												style={{
													position: 'absolute',
													left: '85%',
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
													value={[getEffectiveVolume()]}
													onValueChange={value => handleVolumeChange(value[0])}
													style={
														{
															width: size.width - 45,
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
						<AnimatePresence>
							<motion.div
								className='video-drag-handle'
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.8 }}
								transition={{ type: 'spring', stiffness: 300, damping: 20 }}
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: '100%',
									backgroundColor: 'rgba(0, 0, 0, 0.85)',
									cursor: isDragging ? 'grabbing' : 'move',
									borderRadius: 'var(--radius-4)',
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									pointerEvents: 'auto',
									zIndex: 11004,
								}}
							>
								<motion.div
									initial={{ rotate: -180, opacity: 0 }}
									animate={{ rotate: 0, opacity: 1 }}
									whileHover={{ scale: 1.2 }}
									whileTap={{ scale: 0.9 }}
									transition={{ type: 'spring', stiffness: 400, damping: 17 }}
								>
									<EyeClosedIcon
										style={{ color: 'white', transform: 'scale(1)', cursor: 'pointer' }}
										onClick={() => {
											onCoverToggle(clientID)
											handleToggleMuted()
										}}
									/>
								</motion.div>
							</motion.div>
						</AnimatePresence>
					)}
				</div>
			)}
		</DraggableResizable>
	)
}
