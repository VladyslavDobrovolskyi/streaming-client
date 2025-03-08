import type { ReactNode } from 'react'

export interface UserPosition {
	x: number
	y: number
}

export interface UserSize {
	width: number
	height: number
	scale?: number
}

export interface ParticipantInfo {
	username: string
	avatar: string
	isCameraDisabled: boolean
	isMicrophoneDisabled: boolean
	notified?: boolean
}

export interface ChatMessage {
	username: string
	message: string
	timestamp?: number
}

export interface PrivateMessage {
	from: string
	to: string
	message: string
	timestamp: number
	read: boolean
}

export interface ToastNotification {
	id: string
	avatar: string
	title: string
	description: string
	count: number
}

export interface ActionIndicatorProps {
	action: 'play' | 'pause' | 'mute' | 'unmute' | 'forward' | 'backward' | 'volume' | null
	volume?: number
}

export interface VideoControlsProps {
	isPlaying: boolean
	muted: boolean
	volume: number
	played: number
	loaded: number
	duration: number
	isFullscreen: boolean
	showControls: boolean
	setShowControls: (value: boolean) => void
	showVolumeControl: boolean
	setShowVolumeControl: (value: boolean) => void
	isVolumeActive: boolean
	isRoomChatIsActive: boolean
	isMenuOpen: boolean
	isMicrophoneDisabled: boolean
	isCameraDisabled: boolean
	isMovieMode: boolean
	hideUsers: boolean
	hoveredItem: string | null
	onPlay: () => void
	onPause: () => void
	onSeekChange: (value: number[]) => void
	onSeekStart: () => void
	onSeekEnd: () => void
	onVolumeChange: (volume: number) => void
	onToggleMuted: () => void
	onVolumePointerDown: () => void
	onVolumePointerUp: () => void
	onForward: () => void
	onBackward: () => void
	onFullscreenToggle: () => void
	onMenuOpen: () => void
	onMenuClose: () => void
	onMicMuteUnmute: () => void
	onCameraMuteUnmute: () => void
	onMovieModeToggle: () => void
	onHideUsersToggle: () => void
	onHoveredItemChange: (item: string | null) => void
	onToggleChat: () => void
	formatTime: (seconds: number) => string
	getSpeakerIcon: () => ReactNode
}

export interface UserListProps {
	showUserList: boolean
	toggleUserList: () => void
	clients: string[]
	participantInfo: Record<string, ParticipantInfo>
	localVideoId: string
	isMicrophoneDisabled: boolean
	isCameraDisabled: boolean
	highlightedUser: string | null
	setHighlightedUser: (id: string | null) => void
	togglePrivateChat: (id: string) => void
	unreadMessages: Record<string, number>
	avatar: string
	userListWidth: number
}

export interface ParticipantsViewProps {
	clients: string[]
	participantInfo: Record<string, ParticipantInfo>
	provideMediaRef: (id: string, node: HTMLVideoElement | null) => Promise<void>
	localVideoId: string
	isCameraDisabled: boolean
	isMicrophoneDisabled: boolean
	clientPositions: Record<string, UserPosition>
	clientSizes: Record<string, UserSize>
	coveredClients: Record<string, boolean>
	clientVolumes: Record<string, number>
	highlightedUser: string | null
	hideUsers: boolean
	onPositionChange: (id: string, position: UserPosition) => void
	onSizeChange: (id: string, size: UserSize) => void
	onVolumeChange: (id: string, volume: number) => void
	onCoverToggle: (id: string) => void
	onHighlightChange: (id: string | null) => void
}
