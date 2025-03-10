'use client'

import type { ParticipantsViewProps } from '../../types/room-types'
import ClientVideo from './ClientVideo'

export default function ParticipantsView({
	clients,
	participantInfo,
	provideMediaRef,
	localVideoId,
	isCameraDisabled,
	isMicrophoneDisabled,
	clientPositions,
	clientSizes,
	coveredClients,
	clientVolumes,
	highlightedUser,
	hideUsers,
	onPositionChange,
	onSizeChange,
	onVolumeChange,
	onCoverToggle,
	onHighlightChange,
}: ParticipantsViewProps) {
	return (
		<div
			style={{
				position: 'absolute',
				top: '0',
				left: '0',
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				zIndex: 10,
				opacity: hideUsers ? 0 : 1,
				visibility: hideUsers ? 'hidden' : 'visible',
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
						volume={clientVolumes[clientID] || 1}
						highlightedUser={highlightedUser}
						onMouseEnter={() => onHighlightChange(clientID)}
						onMouseLeave={() => onHighlightChange(null)}
					/>
				)
			})}
		</div>
	)
}
