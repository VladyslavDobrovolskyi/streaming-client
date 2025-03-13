'use client'

import { useEffect, useRef } from 'react'
import ClientVideo from './ClientVideo'

export default function ParticipantsView({
	clients,
	participantInfo,
	provideMediaRef,
	localVideoId,
	isCameraDisabled,
	isMicrophoneDisabled,
	toggleRemoteCamera,
	clientPositions,
	clientSizes,
	clientCameras,
	coveredClients,
	clientVolumes,
	highlightedUser,
	onPositionChange,
	onSizeChange,
	onVolumeChange,
	onCoverToggle,
	onHighlightChange,
	setHideMe,
	previousVolumesRef,
}) {
	// Use a ref to track if we're currently updating from this component
	// This helps prevent circular updates
	const isUpdatingRef = useRef(false)

	// This effect ensures that when clientVolumes changes, all video elements are updated
	// But only if the change didn't originate from within this component
	useEffect(() => {
		// Skip if we're the ones who initiated the update
		if (isUpdatingRef.current) {
			isUpdatingRef.current = false
			return
		}

		Object.entries(clientVolumes).forEach(([clientId, volume]) => {
			const videoElement = document.querySelector(`video[data-client-id="${clientId}"]`) as HTMLVideoElement
			if (videoElement) {
				// Set volume directly on the video element
				videoElement.volume = typeof volume === 'number' ? volume : 0

				// Determine if the video should be muted based on volume and microphone state
				const isMuted =
					volume === 0 ||
					(clientId === localVideoId && isMicrophoneDisabled) ||
					participantInfo[clientId]?.isMicrophoneDisabled

				// Only update if the muted state is different to avoid unnecessary re-renders
				if (videoElement.muted !== isMuted) {
					videoElement.muted = isMuted
				}
			}
		})
	}, [clientVolumes, localVideoId, isMicrophoneDisabled, participantInfo])

	// Wrapper for onVolumeChange that sets the updating flag
	const handleVolumeChange = (id, vol) => {
		isUpdatingRef.current = true
		onVolumeChange(id, vol)
	}

	return (
		<div
			style={{
				position: 'absolute',
				top: '0',
				left: '0',
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				opacity: 1,
				visibility: 'visible',
				transition: 'opacity 0.3s ease, visibility 0.3s ease',
			}}
		>
			{clients.map((clientID, index) => {
				const participantData = participantInfo[clientID] || {}
				const isCameraMuted = clientID === localVideoId ? isCameraDisabled : participantData.isCameraDisabled

				return (
					<ClientVideo
						previousVolumesRef={previousVolumesRef}
						key={clientID}
						clientID={clientID}
						provideMediaRef={provideMediaRef}
						isLocal={clientID === localVideoId}
						participantVolume={clientVolumes}
						toggleCamera={() => toggleRemoteCamera(clientID)}
						isCameraMuted={isCameraMuted}
						isMicrophoneMuted={
							clientID === localVideoId ? isMicrophoneDisabled : participantData.isMicrophoneDisabled
						}
						position={clientPositions[clientID] || { x: 0, y: 0 + index * 110 }}
						size={clientSizes[clientID] || { width: 150, height: 100 }}
						onPositionChange={(id, pos) => onPositionChange(id, pos)}
						onSizeChange={(id, size) => onSizeChange(id, size)}
						onVolumeChange={(id, vol) => handleVolumeChange(id, vol)}
						onCoverToggle={id => onCoverToggle(id)}
						isCovered={coveredClients[clientID]}
						volume={clientVolumes[clientID] || 0}
						highlightedUser={highlightedUser}
						onMouseEnter={() => onHighlightChange(clientID)}
						onMouseLeave={() => onHighlightChange(null)}
						setHideMe={setHideMe}
						cameraStatus={clientCameras[clientID]}
						isMicrophoneDisabled={participantData.isMicrophoneDisabled}
					/>
				)
			})}
		</div>
	)
}
