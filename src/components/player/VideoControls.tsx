'use client'

import { Slider } from '@radix-ui/themes'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
	PauseIcon,
	PlayIcon,
	EnterFullScreenIcon,
	ExitFullScreenIcon,
	DoubleArrowLeftIcon,
	DoubleArrowRightIcon,
	EyeOpenIcon,
	EyeClosedIcon,
	SquareIcon,
	DotsHorizontalIcon,
	SectionIcon,
} from '@radix-ui/react-icons'
import { FaMicrophoneAlt, FaMicrophoneAltSlash } from 'react-icons/fa'
import { BsCameraVideoFill, BsCameraVideoOffFill } from 'react-icons/bs'
import { IoMdChatboxes } from 'react-icons/io'
import { useRef } from 'react'

export default function VideoControls({
	isPlaying,
	muted,
	volume,
	played,
	duration,
	isFullscreen,
	showControls,
	hideMeToggle,
	setShowControls,
	showVolumeControl,
	isRoomChatIsActive,
	setShowVolumeControl,
	isVolumeActive,
	isMenuOpen,
	isMicrophoneDisabled,
	isCameraDisabled,
	isMovieMode,
	hideMe,
	hoveredItem,
	onPlay,
	onPause,
	onSeekChange,
	onSeekStart,
	onSeekEnd,
	onVolumeChange,
	onToggleMuted,
	onVolumePointerDown,
	onVolumePointerUp,
	onForward,
	onBackward,
	onFullscreenToggle,
	onMenuOpen,
	onMenuClose,
	onMicMuteUnmute,
	onCameraMuteUnmute,
	onMovieModeToggle,
	onHoveredItemChange,
	onToggleChat,
	formatTime,
	getSpeakerIcon,
}) {
	const sliderRef = useRef<HTMLDivElement>(null)

	return (
		<div
			className={`controls ${showControls ? 'visible' : 'hidden'}`}
			style={{
				position: 'absolute',
				bottom: '0',
				left: '0',
				right: '0',
				display: 'flex',
				flexDirection: 'column',
				padding: '10px',
				background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
				transition: 'opacity 0.3s ease',
				opacity: showControls ? 1 : 0,
				zIndex: 20,
			}}
		>
			<div
				ref={sliderRef}
				style={{
					margin: '0 0.5rem',
					color: 'white',
					position: 'relative',
					height: '20px',
					cursor: 'pointer',
				}}
			>
				<Slider
					min={0}
					max={duration}
					step={0.01}
					value={[played * duration || 0]}
					onValueChange={onSeekChange}
					onPointerDown={onSeekStart}
					onPointerUp={onSeekEnd}
					style={{
						width: '100%',
						height: '100%',
					}}
				/>
			</div>

			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '0 0.5rem',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 0 auto' }}>
					<button
						onClick={() => {
							if (isPlaying) {
								onPause()
							} else {
								onPlay()
							}
						}}
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
						{isPlaying ? <PauseIcon /> : <PlayIcon />}
					</button>
					<button
						onClick={onBackward}
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
						<DoubleArrowLeftIcon />
					</button>
					<button
						onClick={onForward}
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
						<DoubleArrowRightIcon />
					</button>
					<div
						style={{
							position: 'relative',
							display: 'flex',
							alignItems: 'center',
						}}
						onMouseEnter={() => setShowVolumeControl(true)}
						onMouseLeave={() => {
							if (!isVolumeActive) {
								setShowVolumeControl(false)
							}
						}}
					>
						<button
							onClick={onToggleMuted}
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
							{getSpeakerIcon()}
						</button>
						{!muted && (showVolumeControl || isVolumeActive) && (
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
									value={[muted ? 0 : volume]}
									onValueChange={value => onVolumeChange(value[0])}
									onPointerDown={onVolumePointerDown}
									onPointerUp={onVolumePointerUp}
									style={{
										width: '100px',
										transition: 'all 0.2s ease',
									}}
								/>
							</div>
						)}
					</div>
				</div>

				{duration > 0 && (
					<div
						style={{
							position: 'absolute',
							left: '50%',
							transform: 'translateX(-50%)',
							color: 'white',
							fontSize: '24px',
							textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
							fontFamily: 'Roboto, sans-serif',
						}}
					>
						{formatTime(played * duration)} / {formatTime(duration)}
					</div>
				)}

				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						flex: '1 0 auto',
						justifyContent: 'flex-end',
					}}
				>
					<button
						onClick={onToggleChat}
						style={{
							color: 'white',
							border: 'none',
							padding: '0.5rem',
							borderRadius: '5px',
							cursor: 'pointer',
							background: 'none',
							display: 'flex',
							alignItems: 'center',
							opacity: isRoomChatIsActive ? 0.5 : 1,
							scale: 1.1,
						}}
					>
						<IoMdChatboxes />
					</button>
					<DropdownMenu.Root open={isMenuOpen} onOpenChange={open => (open ? onMenuOpen() : onMenuClose())}>
						<DropdownMenu.Trigger asChild>
							<button
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
								<DotsHorizontalIcon />
							</button>
						</DropdownMenu.Trigger>
						{isMenuOpen && (
							<div
								style={{
									position: 'fixed',
									bottom: showControls ? '60px' : '10px',
									right: '10px',
									zIndex: 9999,
									minWidth: 220,
									transition: 'bottom 0.3s ease',
								}}
							>
								<DropdownMenu.Content
									onMouseEnter={() => {
										setShowControls(true)
									}}
									onMouseLeave={onMenuClose}
									style={{
										backgroundColor: 'rgba(0, 0, 0, 0.8)',
										borderRadius: '4px',
										padding: '4px',
										zIndex: 9999,
									}}
								>
									<DropdownMenu.Item
										onSelect={event => {
											event.preventDefault()
											onMicMuteUnmute()
										}}
										onMouseEnter={() => onHoveredItemChange('mic')}
										onMouseLeave={() => onHoveredItemChange(null)}
										style={{
											padding: '8px 12px',
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											backgroundColor:
												hoveredItem === 'mic' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
											color: 'white',
											border: 'none',
											width: '100%',
											textAlign: 'left',
											outline: 'none',
										}}
									>
										{isMicrophoneDisabled ? <FaMicrophoneAltSlash /> : <FaMicrophoneAlt />}
										{isMicrophoneDisabled ? 'Unmute Microphone' : 'Mute Microphone'}
									</DropdownMenu.Item>
									<DropdownMenu.Item
										onSelect={event => {
											event.preventDefault()
											onCameraMuteUnmute()
										}}
										onMouseEnter={() => onHoveredItemChange('camera')}
										onMouseLeave={() => onHoveredItemChange(null)}
										style={{
											padding: '8px 12px',
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											backgroundColor:
												hoveredItem === 'camera' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
											color: 'white',
											border: 'none',
											width: '100%',
											textAlign: 'left',
											outline: 'none',
										}}
									>
										{isCameraDisabled ? <BsCameraVideoOffFill /> : <BsCameraVideoFill />}
										{isCameraDisabled ? 'Turn Camera On' : 'Turn Camera Off'}
									</DropdownMenu.Item>
									<DropdownMenu.Item
										onSelect={event => {
											event.preventDefault()
											onMovieModeToggle()
										}}
										onMouseEnter={() => onHoveredItemChange('movieMode')}
										onMouseLeave={() => onHoveredItemChange(null)}
										style={{
											padding: '8px 12px',
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											backgroundColor:
												hoveredItem === 'movieMode'
													? 'rgba(255, 255, 255, 0.1)'
													: 'transparent',
											color: 'white',
											border: 'none',
											width: '100%',
											textAlign: 'left',
											outline: 'none',
										}}
									>
										{isMovieMode ? <SectionIcon /> : <SquareIcon />}
										{isMovieMode ? 'Disable Movie Mode' : 'Enable Movie Mode'}
									</DropdownMenu.Item>
									<DropdownMenu.Item
										onSelect={event => {
											event.preventDefault()
											hideMeToggle()
										}}
										onMouseEnter={() => onHoveredItemChange('hideMe')}
										onMouseLeave={() => onHoveredItemChange(null)}
										style={{
											padding: '8px 12px',
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											backgroundColor:
												hoveredItem === 'hideMe' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
											color: 'white',
											border: 'none',
											width: '100%',
											textAlign: 'left',
											outline: 'none',
										}}
									>
										{hideMe ? <EyeOpenIcon /> : <EyeClosedIcon />}
										{hideMe ? 'Show me' : 'Hide me'}
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</div>
						)}
					</DropdownMenu.Root>
					<button
						onClick={onFullscreenToggle}
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
						{isFullscreen ? <ExitFullScreenIcon /> : <EnterFullScreenIcon />}
					</button>
				</div>
			</div>
			<button
				onClick={onToggleChat}
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
			></button>
		</div>
	)
}
