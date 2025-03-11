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
	SectionIcon,
	GearIcon,
} from '@radix-ui/react-icons'
import { FaMicrophoneAlt, FaMicrophoneAltSlash } from 'react-icons/fa'
import { BsCameraVideoFill, BsCameraVideoOffFill } from 'react-icons/bs'
import { IoMdChatboxes } from 'react-icons/io'
import { useEffect, useRef, useState } from 'react'
import { IoMdNotifications } from 'react-icons/io'
import { IoMdNotificationsOff } from 'react-icons/io'

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
	initialCameraDisabledState,
	initialMicrophoneDisabledState,
	hoveredItem,
	unreadRoomMessages,
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
	notificationStatus,
	setNotificationStatus,
	formatTime,
	getSpeakerIcon,
}) {
	const sliderRef = useRef<HTMLDivElement>(null)
	const [tooltipText, setTooltipText] = useState('')
	const [tooltipVisible, setTooltipVisible] = useState(false)
	const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
	const [menuTimeout, setMenuTimeout] = useState<NodeJS.Timeout | null>(null)
	const menuRef = useRef(null)
	const menuItemRefs = {
		mic: useRef<HTMLDivElement>(null),
		camera: useRef<HTMLDivElement>(null),
		movieMode: useRef<HTMLDivElement>(null),
		hideMe: useRef<HTMLDivElement>(null),
		notification: useRef<HTMLDivElement>(null),
	}

	useEffect(() => {
		console.log('Room messages:', unreadRoomMessages)
	}, [unreadRoomMessages])

	// Function to start or reset the menu close timer
	const startMenuCloseTimer = () => {
		// Clear any existing timeout
		if (menuTimeout) {
			clearTimeout(menuTimeout)
		}

		// Set a new timeout
	}

	// When menu opens, start the timer
	useEffect(() => {
		if (isMenuOpen) {
			setMenuTimeout(
				setTimeout(() => {
					onMenuClose()
				}, 3000)
			)
			// Clear timeout when component unmounts or menu closes
			return () => {
				if (menuTimeout) {
					clearTimeout(menuTimeout)
				}
			}
		}
	}, [isMenuOpen])

	const showTooltip = (text, itemKey) => {
		setTooltipText(text)
		setTooltipVisible(true)

		// Get the position of the specific menu item
		const itemElement = menuItemRefs[itemKey]?.current
		if (itemElement) {
			const rect = itemElement.getBoundingClientRect()
			setTooltipPosition({
				x: rect.left - 10, // 10px to the left of the menu item
				y: rect.top + rect.height / 2, // Vertically center with the menu item
			})
		}
	}

	const pulseAnimation = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`

	const hideTooltip = () => {
		setTooltipVisible(false)
	}

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
							transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
						}}
						onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.2)')}
						onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
						onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
						onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.2)')}
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
							transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
						}}
						onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.2)')}
						onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
						onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
						onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.2)')}
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
							transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
						}}
						onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.2)')}
						onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
						onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
						onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.2)')}
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
								transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
							}}
							onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.2)')}
							onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
							onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
							onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.2)')}
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
							transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
							position: 'relative', // Add position relative for badge positioning
						}}
						onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.2)')}
						onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
						onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
						onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.2)')}
					>
						<IoMdChatboxes />
						{unreadRoomMessages > 0 && !isRoomChatIsActive && (
							<>
								<style>{pulseAnimation}</style>
								<div
									style={{
										zIndex: 999999,
										position: 'absolute',
										top: '23%',
										right: '34%',
										backgroundColor: 'rgba(0,0,0,0.7)',
										opacity: 1,
										color: 'white',
										borderRadius: '50%',
										border: '2px solid var(--gray-3)',
										width: '17px',
										height: '17px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '10px',
										fontWeight: 'bold',
										boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
										animation: 'pulse 1.5s infinite ease-in-out',
									}}
								>
									{unreadRoomMessages > 99 ? '99' : unreadRoomMessages}
								</div>
							</>
						)}
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
									transform: isMenuOpen ? 'scale(1.2) rotate(90deg)' : 'scale(1) rotate(0deg)',
									transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
								}}
								onMouseOver={e => {
									if (!isMenuOpen) {
										e.currentTarget.style.transform = 'scale(1.2) rotate(15deg)'
									}
								}}
								onMouseOut={e => {
									if (!isMenuOpen) {
										e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
									}
								}}
								onMouseDown={e => {
									if (!isMenuOpen) {
										e.currentTarget.style.transform = 'scale(0.9) rotate(0deg)'
									}
								}}
								onMouseUp={e => {
									if (!isMenuOpen) {
										e.currentTarget.style.transform = 'scale(1.2) rotate(15deg)'
									}
								}}
							>
								<GearIcon />
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
									className='dropdown-menu-content'
									ref={menuRef}
									onMouseEnter={() => {
										setShowControls(true)
									}}
									style={{
										backgroundColor: 'rgba(0, 0, 0, 0.8)',
										borderRadius: '4px',
										padding: '4px',
										zIndex: 9999,
										overflow: 'hidden',
										width: '100%',
									}}
								>
									<div
										ref={menuItemRefs.mic}
										style={{
											position: 'relative',
											width: '100%',
										}}
									>
										<DropdownMenu.Item
											onSelect={event => {
												event.preventDefault()
												if (!initialMicrophoneDisabledState) {
													onMicMuteUnmute()
												}
											}}
											onMouseEnter={() => {
												// Reset the timer when hovering over menu items
												startMenuCloseTimer()
												onHoveredItemChange('mic')
												showTooltip(
													initialMicrophoneDisabledState
														? 'Permission denied'
														: isMicrophoneDisabled
														? 'Enable Microphone'
														: 'Disable Microphone',
													'mic'
												)
											}}
											onMouseLeave={() => {
												onHoveredItemChange(null)
												hideTooltip()
											}}
											style={{
												padding: '8px 12px',
												cursor: initialMicrophoneDisabledState ? 'not-allowed' : 'pointer',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												backgroundColor:
													hoveredItem === 'mic' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
												color: initialMicrophoneDisabledState
													? 'rgba(255, 255, 255, 0.5)'
													: 'white',
												border: 'none',
												width: '100%',
												textAlign: 'center',
												outline: 'none',
												boxSizing: 'border-box',
												opacity: initialMicrophoneDisabledState ? 0.5 : 1,
												transition: initialMicrophoneDisabledState
													? 'none'
													: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
											}}
											onMouseOver={e => {
												if (!initialMicrophoneDisabledState)
													e.currentTarget.style.transform = 'scale(1.1)'
											}}
											onMouseOut={e => {
												if (!initialMicrophoneDisabledState)
													e.currentTarget.style.transform = 'scale(1)'
											}}
											onMouseDown={e => {
												if (!initialMicrophoneDisabledState)
													e.currentTarget.style.transform = 'scale(0.9)'
											}}
											onMouseUp={e => {
												if (!initialMicrophoneDisabledState)
													e.currentTarget.style.transform = 'scale(1.1)'
											}}
											disabled={initialMicrophoneDisabledState}
										>
											{isMicrophoneDisabled ? <FaMicrophoneAltSlash /> : <FaMicrophoneAlt />}
										</DropdownMenu.Item>
									</div>

									<div
										ref={menuItemRefs.camera}
										style={{
											position: 'relative',
											width: '100%',
										}}
									>
										<DropdownMenu.Item
											onSelect={event => {
												event.preventDefault()
												if (!initialCameraDisabledState) {
													onCameraMuteUnmute()
												}
											}}
											onMouseEnter={() => {
												// Reset the timer when hovering over menu items
												startMenuCloseTimer()
												onHoveredItemChange('camera')
												showTooltip(
													initialCameraDisabledState
														? 'Permission denied'
														: isCameraDisabled
														? 'Enable Camera'
														: 'Disable Camera',
													'camera'
												)
											}}
											onMouseLeave={() => {
												onHoveredItemChange(null)
												hideTooltip()
											}}
											style={{
												padding: '8px 12px',
												cursor: initialCameraDisabledState ? 'not-allowed' : 'pointer',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												backgroundColor:
													hoveredItem === 'camera'
														? 'rgba(255, 255, 255, 0.1)'
														: 'transparent',
												color: initialCameraDisabledState
													? 'rgba(255, 255, 255, 0.5)'
													: 'white',
												border: 'none',
												width: '100%',
												textAlign: 'center',
												outline: 'none',
												boxSizing: 'border-box',
												opacity: initialCameraDisabledState ? 0.5 : 1,
												transition: initialCameraDisabledState
													? 'none'
													: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
											}}
											onMouseOver={e => {
												if (!initialCameraDisabledState)
													e.currentTarget.style.transform = 'scale(1.1)'
											}}
											onMouseOut={e => {
												if (!initialCameraDisabledState)
													e.currentTarget.style.transform = 'scale(1)'
											}}
											onMouseDown={e => {
												if (!initialCameraDisabledState)
													e.currentTarget.style.transform = 'scale(0.9)'
											}}
											onMouseUp={e => {
												if (!initialCameraDisabledState)
													e.currentTarget.style.transform = 'scale(1.1)'
											}}
											disabled={initialCameraDisabledState}
										>
											{isCameraDisabled ? <BsCameraVideoOffFill /> : <BsCameraVideoFill />}
										</DropdownMenu.Item>
									</div>
									<div
										ref={menuItemRefs.notification}
										style={{
											position: 'relative',
											width: '100%',
										}}
									>
										<DropdownMenu.Item
											onSelect={event => {
												event.preventDefault()
												setNotificationStatus(!notificationStatus)
											}}
											onMouseEnter={() => {
												// Reset the timer when hovering over menu items
												startMenuCloseTimer()
												onHoveredItemChange('notification')
												showTooltip(
													notificationStatus
														? 'Disable Notifications'
														: 'Enable Notifications',
													'notification'
												)
											}}
											onMouseLeave={() => {
												onHoveredItemChange(null)

												hideTooltip()
											}}
											style={{
												padding: '8px 12px',
												cursor: 'pointer',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												backgroundColor:
													hoveredItem === 'notification'
														? 'rgba(255, 255, 255, 0.1)'
														: 'transparent',
												color: 'white',
												border: 'none',
												width: '100%',
												textAlign: 'center',
												outline: 'none',
												boxSizing: 'border-box',
												transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
											}}
											onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.1)')}
											onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
											onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
											onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.1)')}
										>
											{notificationStatus ? <IoMdNotifications /> : <IoMdNotificationsOff />}
										</DropdownMenu.Item>
									</div>
									<div
										ref={menuItemRefs.movieMode}
										style={{
											position: 'relative',
											width: '100%',
										}}
									>
										<DropdownMenu.Item
											onSelect={event => {
												event.preventDefault()
												onMovieModeToggle()
											}}
											onMouseEnter={() => {
												// Reset the timer when hovering over menu items
												startMenuCloseTimer()
												onHoveredItemChange('movieMode')
												showTooltip(
													isMovieMode ? 'Disable Movie Mode' : 'Enable Movie Mode',
													'movieMode'
												)
											}}
											onMouseLeave={() => {
												onHoveredItemChange(null)

												hideTooltip()
											}}
											style={{
												padding: '8px 12px',
												cursor: 'pointer',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												backgroundColor:
													hoveredItem === 'movieMode'
														? 'rgba(255, 255, 255, 0.1)'
														: 'transparent',
												color: 'white',
												border: 'none',
												width: '100%',
												textAlign: 'center',
												outline: 'none',
												boxSizing: 'border-box',
												transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
											}}
											onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.1)')}
											onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
											onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
											onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.1)')}
										>
											{isMovieMode ? <SectionIcon /> : <SquareIcon />}
										</DropdownMenu.Item>
									</div>

									<div
										ref={menuItemRefs.hideMe}
										style={{
											position: 'relative',
											width: '100%',
										}}
									>
										<DropdownMenu.Item
											onSelect={event => {
												event.preventDefault()
												if (!isCameraDisabled) {
													hideMeToggle()
												}
											}}
											onMouseEnter={() => {
												// Reset the timer when hovering over menu items
												startMenuCloseTimer()
												onHoveredItemChange('hideMe')
												showTooltip(
													isCameraDisabled
														? 'Camera is disabled '
														: hideMe
														? 'Show me '
														: 'Hide me',
													'hideMe'
												)
											}}
											onMouseLeave={() => {
												onHoveredItemChange(null)

												hideTooltip()
											}}
											style={{
												padding: '8px 12px',
												cursor: isCameraDisabled ? 'not-allowed' : 'pointer',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												backgroundColor:
													hoveredItem === 'hideMe'
														? 'rgba(255, 255, 255, 0.1)'
														: 'transparent',
												color: isCameraDisabled ? 'rgba(255, 255, 255, 0.5)' : 'white',
												border: 'none',
												width: '100%',
												textAlign: 'center',
												outline: 'none',
												opacity: isCameraDisabled ? 0.5 : 1,
												boxSizing: 'border-box',
												transition: isCameraDisabled
													? 'none'
													: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
											}}
											onMouseOver={e => {
												if (!isCameraDisabled) e.currentTarget.style.transform = 'scale(1.1)'
											}}
											onMouseOut={e => {
												if (!isCameraDisabled) e.currentTarget.style.transform = 'scale(1)'
											}}
											onMouseDown={e => {
												if (!isCameraDisabled) e.currentTarget.style.transform = 'scale(0.9)'
											}}
											onMouseUp={e => {
												if (!isCameraDisabled) e.currentTarget.style.transform = 'scale(1.1)'
											}}
											disabled={isCameraDisabled}
										>
											<div
												className='eye-icon-container'
												style={{
													transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
													transform: hideMe ? 'rotate(0deg)' : 'rotate(0deg)',
												}}
											>
												{hideMe ? <EyeOpenIcon /> : <EyeClosedIcon />}
											</div>
										</DropdownMenu.Item>
									</div>
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
							transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
						}}
						onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.2)')}
						onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
						onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
						onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.2)')}
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

			{tooltipVisible && (
				<div
					style={{
						position: 'fixed',
						left: `${tooltipPosition.x}px`,
						top: `${tooltipPosition.y}px`,
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						color: 'white',
						padding: '4px 8px',
						borderRadius: '4px',
						fontSize: '12px',
						zIndex: 10000,
						pointerEvents: 'none',
						transform: 'translateX(-100%) translateY(-50%)', // Move it to the left and center vertically
						whiteSpace: 'nowrap',
						opacity: 0,
						animation: 'fadeIn 0.2s forwards',
					}}
				>
					<style>
						{`
							@keyframes fadeIn {
								from { opacity: 0; transform: translateX(-100%) translateY(-40%); }
								to { opacity: 1; transform: translateX(-100%) translateY(-50%); }
							}
						`}
					</style>
					{tooltipText}
				</div>
			)}
		</div>
	)
}
