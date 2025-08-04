'use client'

import type React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
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
// import { BsCameraVideoFill, BsCameraVideoOffFill } from 'react-icons/bs'

// Add this near the top of the component, with the other hooks

// Replace with this implementation that includes DOM removal/re-addition
const useForceRemountUpdate = () => {
	const [isVisible, setIsVisible] = useState(true)

	const forceRemountUpdate = useCallback(() => {
		setIsVisible(false)
		// Add back to DOM after a short delay
		setTimeout(() => {
			setIsVisible(true)
		}, 50) // 50ms delay should be enough for DOM cleanup
	}, [])

	return { isVisible, forceRemountUpdate }
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
	participantVolume,
	onCoverToggle,
	isCovered,
	volume,
	highlightedUser,
	onMouseEnter,
	onMouseLeave,
	toggleCamera,
	cameraStatus,
	isMicrophoneDisabled,
	setHideMe,
	previousVolumesRef,
	reinitializeStream,
}) {
	// Replace the forceUpdate with forceRemountUpdate
	const { isVisible, forceRemountUpdate } = useForceRemountUpdate()
	const [hoveredClient, setHoveredClient] = useState<string | null>(null)
	const [volumeBeforeMute, setVolumeBeforeMute] = useState(0)
	const [muted, setMuted] = useState(false)
	const [mutedBySlider, setMutedBySlider] = useState(false)
	const videoRef = useRef<HTMLVideoElement>(null)
	const DEFAULT_VOLUME = 0.5
	// Add a ref to track if we're in the middle of a volume update
	const isUpdatingVolumeRef = useRef(false)
	// Add a state for camera opacity after the existing state declarations
	// const [cameraOpacity, setCameraOpacity] = useState(1.0)
	const [scale, setScale] = useState(1)
	// Add a ref to track retry attempts

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

	useEffect(() => {
		if (highlightedUser === clientID) {
			setHoveredClient(highlightedUser)
		} else {
			setHoveredClient(null)
		}
	}, [clientID, highlightedUser, setHoveredClient])

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

	// Initialize new users with default volume - only runs once when the component mounts
	useEffect(() => {
		// If this client doesn't have a volume set in participantVolume, initialize it
		if (participantVolume && !(clientID in participantVolume)) {
			// Always ensure new users have a non-zero volume
			// If volume prop is greater than 0, use it, otherwise use DEFAULT_VOLUME
			const initialVolume = volume !== undefined && volume !== null && volume > 0 ? volume : DEFAULT_VOLUME

			// Update the parent state
			onVolumeChange(clientID, initialVolume)

			// Ensure muted state is false for new users
			setMuted(false)

			// Directly update the video element if it exists
			if (videoRef.current) {
				videoRef.current.volume = initialVolume
				videoRef.current.muted = isLocal || isMicrophoneMuted
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []) // Empty dependency array means this only runs once

	// This effect updates the UI state based on the current volume
	// It doesn't modify the video element directly to avoid loops
	useEffect(() => {
		// Skip if we're in the middle of updating volume
		if (isUpdatingVolumeRef.current) {
			isUpdatingVolumeRef.current = false
			return
		}

		const effectiveVolume = getEffectiveVolume()

		// Update local state based on the effective volume
		setMuted(effectiveVolume === 0)

		// Don't update the video element here - that's handled by the parent
	}, [participantVolume, clientID, volume])

	// Add this effect to handle the isCovered state
	useEffect(() => {
		if (isCovered && !isUpdatingVolumeRef.current) {
			// When covered, set volume to 0 in participantVolume
			isUpdatingVolumeRef.current = true
			onVolumeChange(clientID, 0)
			setMuted(true)
		}
	}, [isCovered, clientID, onVolumeChange])

	useEffect(() => {
		// Only update if scale is different from the current size.scale
		onSizeChange(clientID, {
			width: size.width,
			height: size.height,
			scale,
		})
	}, [scale, size, clientID, onSizeChange])

	// Handle local mute/unmute
	const handleToggleMuted = () => {
		isUpdatingVolumeRef.current = true

		if (mutedBySlider) {
			setMuted(false)
			setMutedBySlider(false)
			onVolumeChange(clientID, DEFAULT_VOLUME) // Update participantVolume
			return
		}

		if (muted) {
			// Unmuting - update participantVolume
			const newVolume = volumeBeforeMute > 0 ? volumeBeforeMute : DEFAULT_VOLUME
			onVolumeChange(clientID, newVolume) // This updates participantVolume
		} else {
			// Muting - save current volume and update participantVolume
			const currentVolume = getEffectiveVolume()
			setVolumeBeforeMute(currentVolume > 0 ? currentVolume : DEFAULT_VOLUME)
			onVolumeChange(clientID, 0) // This updates participantVolume
		}
	}

	// Update the handleVolumeChange function to handle muting at 0 volume
	const handleVolumeChange = (newVolume: number) => {
		isUpdatingVolumeRef.current = true

		// Store current volume before muting if we're going to 0
		if (newVolume === 0 && getEffectiveVolume() > 0) {
			setVolumeBeforeMute(getEffectiveVolume())
		}

		if (newVolume === 0) {
			setMuted(true)
			setMutedBySlider(true)
		} else {
			setMuted(false)
			setMutedBySlider(false)
		}

		onVolumeChange(clientID, newVolume) // This updates participantVolume

		// Dispatch custom event for synchronization
		const event = new CustomEvent('client-volume-change', {
			detail: { clientID, volume: newVolume },
		})
		document.dispatchEvent(event)
	}

	useEffect(() => {
		if (isMicrophoneDisabled) {
			// Save current volume to the ref before muting
			const currentVolume = getEffectiveVolume()
			if (currentVolume > 0) {
				previousVolumesRef.current[clientID] = currentVolume
			}

			// Instead of changing volume to 0, just mute the video element
			if (videoRef.current) {
				videoRef.current.muted = true
			}

			// Update UI state to show as muted
			setMuted(true)
		} else if (previousVolumesRef.current[clientID]) {
			// Restore previous volume when microphone is enabled again
			const previousVolume = previousVolumesRef.current[clientID]

			// Unmute the video element while keeping the volume
			if (videoRef.current) {
				videoRef.current.muted = false
				videoRef.current.volume = previousVolume
			}

			// Update UI state
			setMuted(false)
		}
	}, [isMicrophoneDisabled, clientID, previousVolumesRef])

	// Also update the effect that listens for volume changes from UserList
	useEffect(() => {
		const handleUserListVolumeChange = e => {
			const { clientID: changedClientID, volume } = e.detail
			if (changedClientID === clientID && !isUpdatingVolumeRef.current) {
				// Only update if this is the target client and we're not already updating
				isUpdatingVolumeRef.current = true

				// Store current volume before muting if we're going to 0
				if (volume === 0 && getEffectiveVolume() > 0) {
					setVolumeBeforeMute(getEffectiveVolume())
				}

				// Update UI state based on new volume
				if (volume === 0) {
					setMuted(true)
					setMutedBySlider(true)
				} else {
					setMuted(false)
					setMutedBySlider(false)
				}

				// Update the video element directly if it exists
				if (videoRef.current) {
					videoRef.current.volume = volume
				}

				// Reset the updating flag after a short delay
				setTimeout(() => {
					isUpdatingVolumeRef.current = false
				}, 50)
			}
		}

		document.addEventListener('update-user-volume', handleUserListVolumeChange)

		return () => {
			document.removeEventListener('update-user-volume', handleUserListVolumeChange)
		}
	}, [clientID])

	// Add a new useEffect to periodically check if the video stream exists
	// Place this after the other useEffect hooks

	// Add a ref to track the last time we checked for a stream
	const lastStreamCheckRef = useRef(Date.now())
	const STREAM_CHECK_INTERVAL = 5000 // Check every 5 seconds

	// Add this useEffect to periodically check if the stream exists
	useEffect(() => {
		// Only run this check for remote participants (not local)
		if (isLocal) return

		const checkVideoStream = () => {
			// Skip if we've checked recently
			const now = Date.now()
			if (now - lastStreamCheckRef.current < STREAM_CHECK_INTERVAL) return

			lastStreamCheckRef.current = now

			// Check if video element exists and has active tracks
			if (videoRef.current) {
				const hasVideoTracks =
					videoRef.current.srcObject instanceof MediaStream &&
					(videoRef.current.srcObject as MediaStream).getVideoTracks().length > 0

				// If camera is enabled but no video tracks, reinitialize
				if (!hasVideoTracks && !isCameraMuted && cameraStatus !== false) {
					console.log(`No video stream detected for client ${clientID}, reinitializing...`)
					reinitializeStream(clientID)
					// Remove from DOM and add back instead of just forcing a re-render
					forceRemountUpdate()
				}
			}
		}

		// Check immediately on mount
		checkVideoStream()

		// Set up interval to check periodically
		const intervalId = setInterval(checkVideoStream, STREAM_CHECK_INTERVAL)

		return () => {
			clearInterval(intervalId)
		}
	}, [clientID, reinitializeStream, isCameraMuted, cameraStatus, isLocal, forceRemountUpdate])

	// Replace the handleVideoError function with a simpler version that just logs
	const handleVideoError = e => {
		console.error(`Video loading error for client ${clientID}:`, e)
		// We're not automatically reinitializing on error anymore
		// since we're doing proactive checks instead
	}

	const getVolumeIcon = () => {
		const IconStyles = {
			color: 'white',
			transform: 'scale(0.6)',
		}

		// Get effective volume
		const effectiveVolume = getEffectiveVolume()

		if (muted || effectiveVolume === 0)
			return <SpeakerOffIcon style={{ ...IconStyles, opacity: 0.6, transform: 'scale(0.5)' }} />
		if (effectiveVolume < 0.33) return <SpeakerQuietIcon style={IconStyles} />
		if (effectiveVolume < 0.66) return <SpeakerModerateIcon style={IconStyles} />
		return <SpeakerLoudIcon style={IconStyles} />
	}

	return (
		// Only render if isVisible is true
		isVisible ? (
			<DraggableResizable
				initialSize={{ width: size.width, height: size.height, scale: size.scale }}
				initialPosition={position}
				bounds='parent'
				minConstraints={[100, 75]}
				maxConstraints={[300, 200]}
				onPositionChange={newPosition => onPositionChange(clientID, newPosition)}
				onSizeChange={newSize => {
					if (newSize.scale !== undefined) {
						setScale(newSize.scale)
					}
					onSizeChange(clientID, newSize)
				}}
				dragHandleClassName='video-drag-handle'
				resizeHandleStyles={{
					zIndex: 12000,
					pointerEvents: 'auto',
				}}
				hide={false} // Убираем скрытие на уровне DraggableResizable
				focused={highlightedUser === clientID || hoveredClient === clientID}
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
							display: isCameraMuted ? 'none' : 'block', // Оставляем только одно условие скрытия
							border:
								highlightedUser === clientID
									? '3px solid var(--accent-color-main'
									: '3px solid transparent',
							boxShadow: highlightedUser === clientID ? '0 0 10px cyan' : 'none',
							borderRadius: 'var(--radius-4)',
							zIndex: hoveredClient === clientID ? 2147483647 : 11000,
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
							onError={handleVideoError}
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
												onClick={isMicrophoneDisabled ? undefined : handleToggleMuted}
												style={{
													color: 'white',
													border: 'none',
													padding: '0.5rem',
													borderRadius: 'var(--radius-4)',
													cursor: isMicrophoneDisabled ? 'default' : 'pointer',
													background: 'none',
													display: 'flex',
													alignItems: 'center',
													opacity: isMicrophoneDisabled ? 0.5 : 1,
												}}
											>
												{getVolumeIcon()}
											</button>
											{!muted && !isMicrophoneDisabled && getEffectiveVolume() > 0 && (
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
		) : null
	)
}
