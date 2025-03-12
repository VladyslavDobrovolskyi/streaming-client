'use client'

import { useEffect } from 'react'
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
}) {
	// This effect ensures that when clientVolumes changes, all video elements are updated
	useEffect(() => {
		Object.entries(clientVolumes).forEach(([clientId, volume]) => {
			const videoElement = document.querySelector(`video[data-client-id="${clientId}"]`) as HTMLVideoElement
			if (videoElement) {
				console.log(`ParticipantsView: Setting volume for ${clientId} to ${volume}`)
				// videoElement.volume = volume

				// Determine if the video should be muted based on volume and microphone state
				const isMuted =
					volume === 0 ||
					(clientId === localVideoId && isMicrophoneDisabled) ||
					participantInfo[clientId]?.isMicrophoneDisabled

				videoElement.muted = isMuted
				console.log(`ParticipantsView: Setting muted for ${clientId} to ${isMuted}`)
			}
		})
	}, [clientVolumes, localVideoId, isMicrophoneDisabled, participantInfo])

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
						key={clientID}
						clientID={clientID}
						provideMediaRef={provideMediaRef}
						isLocal={clientID === localVideoId}
						participantVolume={clientVolumes}
						toggleCamera={() => toggleRemoteCamera(clientID)}
						// username={participantData.username || 'Anonymous'}
						isCameraMuted={isCameraMuted}
						isMicrophoneMuted={
							clientID === localVideoId ? isMicrophoneDisabled : participantData.isMicrophoneDisabled
						}
						position={clientPositions[clientID] || { x: 0, y: 0 + index * 110 }}
						size={clientSizes[clientID] || { width: 150, height: 100 }}
						onPositionChange={(id, pos) => onPositionChange(id, pos)}
						onSizeChange={(id, size) => onSizeChange(id, size)}
						onVolumeChange={(id, vol) => onVolumeChange(id, vol)}
						onCoverToggle={id => onCoverToggle(id)}
						isCovered={coveredClients[clientID]}
						volume={clientVolumes[clientID] || 0} // Default to 0.5 instead of 1
						highlightedUser={highlightedUser}
						onMouseEnter={() => onHighlightChange(clientID)}
						onMouseLeave={() => onHighlightChange(null)}
						setHideMe={setHideMe}
						cameraStatus={clientCameras[clientID]}
					/>
				)
			})}
		</div>
	)
}
