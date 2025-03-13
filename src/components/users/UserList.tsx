'use client'

import { Avatar } from '@radix-ui/themes'
import { FaMicrophoneAlt, FaMicrophoneAltSlash } from 'react-icons/fa'
import { BsCameraVideoFill, BsCameraVideoOffFill } from 'react-icons/bs'
import { IoChatbox } from 'react-icons/io5'
import { ImCross } from 'react-icons/im'
import { LiaUsersCogSolid } from 'react-icons/lia'
import { useEffect, useRef, useState } from 'react'
// import { FaUsers } from 'react-icons/fa'
// import type { UserListProps } from '../../types/room-types'

// Add this after the imports
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

// Add this after the pulseAnimation
const volumeChangeAnimation = `
  @keyframes volumeChange {
    0% {
      transform: translateX(-50%) scale(1);
    }
    50% {
      transform: translateX(-50%) scale(1.2);
    }
    100% {
      transform: translateX(-50%) scale(1);
    }
  }
  
  .volume-change {
    animation: volumeChange 0.3s ease;
  }
`

// Добавьте следующие стили для визуальной обратной связи при наведении на микрофон
const micHoverAnimation = `
  @keyframes micHover {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
  
  .mic-hover {
    animation: micHover 1s infinite ease-in-out;
  }
`

// Add this after the micHoverAnimation
const cameraHoverAnimation = `
  @keyframes cameraHover {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
  
  .camera-hover {
    animation: cameraHover 1s infinite ease-in-out;
  }
`

export default function UserList({
	showUserList,
	toggleUserList,
	clients,
	participantInfo,
	localVideoId,
	isMicrophoneDisabled,
	isCameraDisabled,
	highlightedUser,
	setHighlightedUser,
	participantVolume,
	participantCameras,
	togglePrivateChat,
	toggleRemoteMic,
	toggleRemoteCamera,
	unreadMessages,
	avatar,
	userListWidth,
	showUserListButton,
	privateChats,
	changeRemoteVolume, // Добавляем новый проп
	changeCameraOpacity,
	previousVolumesRef,
	camerasOpacity,
}) {
	// Store previous volumes to remember them between toggles
	// Store our own volume state to avoid using toggleRemoteMic for volume changes
	const [localVolumes, setLocalVolumes] = useState({})

	const [hoveredMicClientId, setHoveredMicClientId] = useState(null)
	const [isVolumeChanging, setIsVolumeChanging] = useState(false)

	// Add state to track microphones being unmuted to prevent cross icon flicker
	const [unmutingMics, setUnmutingMics] = useState({})

	// Add state for camera hover
	const [hoveredCameraClientId, setHoveredCameraClientId] = useState(null)

	// Add state for camera opacity changing
	const [isCameraOpacityChanging, setIsCameraOpacityChanging] = useState(false)

	// Add local camera opacities state similar to localVolumes
	const [localCameraOpacities, setLocalCameraOpacities] = useState({})

	// Store previous camera opacities to remember them between toggles
	const previousCameraOpacitiesRef = useRef(new Map())

	// Добавляем глобальный обработчик для предотвращения стандартного поведения колесика
	// useEffect(() => {
	//   const preventDefaultWheel = (e) => {
	//     if (volumeChangeMode && hoveredMicClientId) {
	//       e.preventDefault()
	//       return false
	//     }
	//   }

	//   // Используем passive: false для возможности вызова preventDefault()
	//   window.addEventListener("wheel", preventDefaultWheel, { passive: false })

	//   return () => {
	//     window.removeEventListener("wheel", preventDefaultWheel)
	//   }
	// }, [volumeChangeMode, hoveredMicClientId])

	// Initialize local volumes from participantVolume when it changes
	useEffect(() => {
		if (!isVolumeChanging) {
			setLocalVolumes(participantVolume)
		}
	}, [participantVolume, isVolumeChanging])

	// Initialize local camera opacities when camerasOpacity changes
	useEffect(() => {
		if (!isCameraOpacityChanging) {
			setLocalCameraOpacities(camerasOpacity)
		}
	}, [camerasOpacity, isCameraOpacityChanging])

	// Слушаем события изменения громкости от RoomPage
	useEffect(() => {
		const handleVolumeChanged = e => {
			const { clientID, volume } = e.detail

			if (!isVolumeChanging) {
				setLocalVolumes(prev => ({
					...prev,
					[clientID]: volume,
				}))
			}
		}

		document.addEventListener('volume-changed', handleVolumeChanged)

		return () => {
			document.removeEventListener('volume-changed', handleVolumeChanged)
		}
	}, [isVolumeChanging])

	// Add function to handle camera opacity wheel events
	const handleCameraOpacityWheel = (event, clientID) => {
		event.preventDefault()
		event.stopPropagation()

		// Check if camera is disabled for this client
		const isCamDisabled =
			participantInfo[clientID]?.isCameraDisabled || (clientID === localVideoId && isCameraDisabled)

		// Don't process wheel events if camera is disabled
		if (isCamDisabled) {
			console.log(`Camera is disabled for ${clientID}, ignoring opacity change`)
			return
		}

		setIsCameraOpacityChanging(true)

		// Determine direction (up or down)
		const direction = event.deltaY < 0 ? 1 : -1
		const isScrollingUp = direction > 0

		// Check if camera is currently off
		const isCameraOff = participantCameras[clientID] === false

		// If camera is off and user is scrolling up, turn it back on
		if (isCameraOff && isScrollingUp) {
			console.log(`Camera is off and scrolling up, turning camera back on for ${clientID}`)

			// Get the previous opacity if available, otherwise use default (0.2)
			const previousOpacity = previousCameraOpacitiesRef.current.get(clientID) || 0.2

			// Turn camera back on
			toggleRemoteCamera(clientID)

			// Set opacity to previous value
			changeCameraOpacity(clientID, previousOpacity)

			// Update local state for immediate feedback
			setLocalCameraOpacities(prev => ({
				...prev,
				[clientID]: previousOpacity,
			}))

			// Add visual feedback
			const opacityIndicator = document.querySelector(`[data-camera-indicator="${clientID}"]`)
			if (opacityIndicator) {
				opacityIndicator.textContent = `${Math.round(previousOpacity * 100)}%`
				opacityIndicator.classList.add('volume-change')
				setTimeout(() => opacityIndicator.classList.remove('volume-change'), 300)
			}

			// Reset the changing flag after a short delay
			setTimeout(() => {
				setIsCameraOpacityChanging(false)
			}, 100)

			return
		}

		// If camera is on, proceed with normal opacity adjustment
		if (!isCameraOff) {
			// Get current opacity from our local state, default to 1 if not set
			const currentOpacity = localCameraOpacities[clientID] !== undefined ? localCameraOpacities[clientID] : 1

			// Adjust opacity by 0.05 (5%) per wheel tick
			let newOpacity = Math.max(0.1, Math.min(1, currentOpacity + direction * 0.05))
			newOpacity = Math.round(newOpacity * 100) / 100 // Round to 2 decimal places

			console.log(
				`Adjusting camera opacity: ${Math.round(currentOpacity * 100)}% → ${Math.round(newOpacity * 100)}%`
			)

			// If opacity is going below 10%, turn off the camera
			if (newOpacity <= 0.1 && currentOpacity > 0.1) {
				console.log(`Camera opacity below 10%, turning off camera for ${clientID}`)

				// Save the current opacity before turning off
				previousCameraOpacitiesRef.current.set(clientID, currentOpacity)

				// Turn off camera
				toggleRemoteCamera(clientID)

				// Add visual feedback
				const opacityIndicator = document.querySelector(`[data-camera-indicator="${clientID}"]`)
				if (opacityIndicator) {
					opacityIndicator.textContent = '0%'
					opacityIndicator.classList.add('volume-change')
					setTimeout(() => opacityIndicator.classList.remove('volume-change'), 300)
				}
			} else {
				// Call the function to change camera opacity
				changeCameraOpacity(clientID, newOpacity)

				// Update local state for immediate feedback
				setLocalCameraOpacities(prev => ({
					...prev,
					[clientID]: newOpacity,
				}))

				// Add visual feedback for opacity change
				const opacityIndicator = document.querySelector(`[data-camera-indicator="${clientID}"]`)
				if (opacityIndicator) {
					opacityIndicator.textContent = `${Math.round(newOpacity * 100)}%`
					opacityIndicator.classList.add('volume-change')
					setTimeout(() => opacityIndicator.classList.remove('volume-change'), 300)
				}
			}
		}

		// Reset the changing flag after a short delay
		setTimeout(() => {
			setIsCameraOpacityChanging(false)
		}, 100)
	}

	// Функция для запроса изменения громкости через RoomPage
	// Удалите эту функцию
	// const requestVolumeChange = (clientID, volume) => {
	//   // Отправляем событие, которое будет обработано в RoomPage
	//   const event = new CustomEvent("volume-change-request", {
	//     detail: { clientID, volume }
	//   });
	//   document.dispatchEvent(event);
	//
	//   // Обновляем локальное состояние для мгновенной обратной связи
	//   setLocalVolumes(prev => ({
	//     ...prev,
	//     [clientID]: volume
	//   }));
	// };

	const handleVolumeWheel = (event, clientID) => {
		event.preventDefault()
		event.stopPropagation()

		// Check if microphone is disabled for this client
		const isMicDisabled =
			clientID === localVideoId ? isMicrophoneDisabled : participantInfo[clientID]?.isMicrophoneDisabled

		// Don't process wheel events if microphone is disabled
		if (isMicDisabled) {
			console.log(`Microphone is disabled for ${clientID}, ignoring volume change`)
			return
		}

		setIsVolumeChanging(true)

		// Determine direction (up or down)
		const direction = event.deltaY < 0 ? 1 : -1

		// Get current volume from our local state
		const currentVolume =
			localVolumes[clientID] !== undefined
				? localVolumes[clientID]
				: participantVolume[clientID] !== undefined
				? participantVolume[clientID]
				: 0.5

		// Increase the step size to 0.05 (5%) per wheel tick for more noticeable changes
		let newVolume = Math.max(0, Math.min(1, currentVolume + direction * 0.05))
		newVolume = Math.round(newVolume * 100) / 100 // Round to 2 decimal places

		console.log(`Adjusting volume: ${Math.round(currentVolume * 100)}% → ${Math.round(newVolume * 100)}%`)

		// Если громкость достигла 0, сохраняем предыдущее значение
		if (newVolume === 0 && currentVolume > 0) {
			previousVolumesRef.current.set(clientID, currentVolume)
			console.log(`Volume reached 0, saving previous volume: ${currentVolume}`)
		}

		// Вызываем changeRemoteVolume напрямую вместо отправки события
		changeRemoteVolume(clientID, newVolume)

		// Обновляем локальное состояние для мгновенной обратной связи
		setLocalVolumes(prev => ({
			...prev,
			[clientID]: newVolume,
		}))

		// Add visual feedback for volume change
		const volumeIndicator = document.querySelector(`[data-volume-indicator="${clientID}"]`)
		if (volumeIndicator) {
			volumeIndicator.textContent = `${Math.round(newVolume * 100)}%`
			volumeIndicator.classList.add('volume-change')
			setTimeout(() => volumeIndicator.classList.remove('volume-change'), 300)
		}

		// Сбрасываем флаг изменения громкости через небольшую задержку
		setTimeout(() => {
			setIsVolumeChanging(false)
		}, 100)
	}

	// useEffect(() => {
	//   if (volumeChangeMode && hoveredMicClientId) {
	//     const wheelHandler = (e) => handleVolumeWheel(e, hoveredMicClientId)

	//     // Используем capture phase для гарантии перехвата события
	//     window.addEventListener("wheel", wheelHandler, { passive: false, capture: true })

	//     // Добавим обработчик для предотвращения потери фокуса
	//     const preventBlur = (e) => {
	//       if (volumeChangeMode) {
	//         e.preventDefault()
	//         e.stopPropagation()
	//       }
	//     }

	//     window.addEventListener("blur", preventBlur, { capture: true })

	//     return () => {
	//       window.removeEventListener("wheel", wheelHandler, { capture: true })
	//       window.removeEventListener("blur", preventBlur, { capture: true })
	//     }
	//   }
	// }, [volumeChangeMode, hoveredMicClientId])

	// Enhanced toggleRemoteMic function that preserves previous volume
	const handleToggleRemoteMic = clientID => {
		console.log(`UserList: Toggling mic for ${clientID}, current volume: ${participantVolume[clientID]}`)

		// If the participant is currently not muted (volume > 0)
		if (participantVolume[clientID] > 0) {
			// Store the current volume before muting
			previousVolumesRef.current.set(clientID, participantVolume[clientID])

			// Call the original toggleRemoteMic with additional context
			toggleRemoteMic(clientID, {
				previousVolume: participantVolume[clientID],
				action: 'mute',
			})
		} else {
			// Unmute: Get the previous volume if available, otherwise use default (0.5)
			const previousVolume = previousVolumesRef.current.get(clientID) || 0.5

			// Set unmuting flag to prevent cross icon from showing during transition
			setUnmutingMics(prev => ({
				...prev,
				[clientID]: true,
			}))

			// First update the volume to avoid the cross icon flicker
			changeRemoteVolume(clientID, previousVolume)

			// Update local state for immediate feedback
			setLocalVolumes(prev => ({
				...prev,
				[clientID]: previousVolume,
			}))

			// Then call the original toggleRemoteMic with additional context
			toggleRemoteMic(clientID, {
				previousVolume: previousVolume,
				action: 'unmute',
			})

			// Clear the unmuting flag after a short delay
			setTimeout(() => {
				setUnmutingMics(prev => ({
					...prev,
					[clientID]: false,
				}))
			}, 500) // Adjust this timeout as needed
		}
	}

	useEffect(() => {
		const saveHighlightedUser = highlightedUser
		if (!showUserList) {
			setHighlightedUser(null)
			setHighlightedUser(saveHighlightedUser)
		}
	}, [showUserList, highlightedUser, setHighlightedUser])

	// Reset mic hover state when microphone is disabled by another user
	useEffect(() => {
		if (hoveredMicClientId && participantInfo[hoveredMicClientId]?.isMicrophoneDisabled) {
			// Reset the hover state
			setHoveredMicClientId(null)

			// Find the element and reset its transform
			const micElement = document.querySelector(`[data-mic-element="${hoveredMicClientId}"]`) as HTMLElement
			if (micElement) {
				micElement.style.transform = 'scale(1)'
			}
		}
	}, [hoveredMicClientId, participantInfo])

	// Reset camera hover state when camera is disabled by another user
	useEffect(() => {
		if (
			hoveredCameraClientId &&
			(participantInfo[hoveredCameraClientId]?.isCameraDisabled ||
				(hoveredCameraClientId === localVideoId && isCameraDisabled))
		) {
			// Reset the hover state
			setHoveredCameraClientId(null)

			// Find the element and reset its transform
			const cameraElement = document.querySelector(
				`[data-camera-element="${hoveredCameraClientId}"]`
			) as HTMLElement
			if (cameraElement) {
				cameraElement.style.transform = 'scale(1)'
			}
		}
	}, [hoveredCameraClientId, participantInfo, localVideoId, isCameraDisabled])

	const filteredClients = clients.filter(clientID => clientID !== 'LOCAL_VIDEO')

	// Get the volume to display - prefer our local volume state, fall back to participantVolume
	const getDisplayVolume = clientID => {
		return localVolumes[clientID] !== undefined ? localVolumes[clientID] : participantVolume[clientID] || 0
	}

	// Add this function to get camera status display
	const getDisplayCameraStatus = clientID => {
		return participantCameras[clientID] !== false
	}

	// Add this function to get camera opacity display - prefer local state, fall back to camerasOpacity
	const getDisplayCameraOpacity = clientID => {
		return localCameraOpacities[clientID] !== undefined
			? localCameraOpacities[clientID]
			: camerasOpacity[clientID] || 1
	}

	// Function to determine if we should show the cross icon for a microphone
	const shouldShowMicCross = clientID => {
		const isMicDisabled =
			clientID === localVideoId ? isMicrophoneDisabled : participantInfo[clientID]?.isMicrophoneDisabled

		// Don't show cross if mic is disabled or if we're in the process of unmuting
		return getDisplayVolume(clientID) === 0 && !isMicDisabled && !unmutingMics[clientID]
	}

	return (
		<>
			<style>{pulseAnimation}</style>
			<style>{volumeChangeAnimation}</style>
			<style>{micHoverAnimation}</style>
			<style>{cameraHoverAnimation}</style>

			{filteredClients.length >= 1 && filteredClients.length !== 0 && (
				<div
					style={{
						display: showUserListButton ? 'block' : 'none',
						position: 'absolute',
						top: '50%',
						right: showUserList ? userListWidth : 0,
						transform: 'translateY(-50%)',
						zIndex: 30,
						transition: 'right 0.3s ease-in-out',
					}}
				>
					<button
						onClick={toggleUserList}
						style={{
							background: 'rgba(0, 0, 0, 0.5)',
							border: 'none',
							borderRadius: '50% 0 0 50%',
							padding: '10px',
							cursor: 'pointer',
							transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
							marginRight: showUserList ? '5px' : '0',
							backdropFilter: 'blur(4px)',
							transform: showUserList ? 'scale(1.2)' : 'scale(1)',
						}}
						onMouseOver={e => (showUserList ? null : (e.currentTarget.style.transform = 'scale(1.2)'))}
						onMouseOut={e => (showUserList ? null : (e.currentTarget.style.transform = 'scale(1)'))}
						onMouseDown={e => (showUserList ? null : (e.currentTarget.style.transform = 'scale(0.9)'))}
						onMouseUp={e => (showUserList ? null : (e.currentTarget.style.transform = 'scale(1.2)'))}
						onKeyDown={e => {
							e.preventDefault()
						}}
					>
						<LiaUsersCogSolid style={{ color: 'white' }} />
					</button>
				</div>
			)}

			{showUserList && filteredClients.length >= 1 && filteredClients.length !== 0 && (
				<div
					style={{
						position: 'absolute',
						top: 0,
						right: 0,
						width: `${userListWidth}px`,
						height: '100%',
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						backdropFilter: 'blur(4px)',
						zIndex: 25,
						overflowY: 'auto',
						overflowX: 'hidden',
						transition: 'right 0.5s ease-in-out',
					}}
				>
					<h2 style={{ color: 'white', padding: '5px' }}></h2>
					{Object.keys(participantInfo).length === 0 && (
						<div style={{ padding: '10px', color: 'white', textAlign: 'center' }}>
							<p>No other participants are currently in the room.</p>
						</div>
					)}
					{clients
						.filter(clientID => clientID !== localVideoId)
						.map(clientID => {
							const username = participantInfo[clientID]?.username || 'Anonymous'
							const displayUsername = username
							const isMicDisabled =
								clientID === localVideoId
									? isMicrophoneDisabled
									: participantInfo[clientID]?.isMicrophoneDisabled

							return (
								<div
									key={clientID}
									style={{
										padding: '10px',
										border:
											highlightedUser == clientID
												? '3px solid rgba(255, 255, 255, 1)'
												: '3px solid transparent',
										borderRadius: '5px',
										backgroundColor:
											highlightedUser === clientID ? 'rgba(255,255,255,0.2)' : 'transparent',
										display: 'flex',
										alignItems: 'center',
										gap: '10px',
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}
									onMouseEnter={() => setHighlightedUser(clientID)}
									onMouseLeave={() => setHighlightedUser(null)}
									//
								>
									<Avatar
										src={clientID === localVideoId ? avatar : participantInfo[clientID]?.avatar}
										fallback='?'
										style={{ borderRadius: '0%' }}
									/>
									<div style={{ position: 'relative', flexGrow: 1 }}>
										<p
											style={{
												color: 'white',
												margin: 0,
												cursor: username.length > 15 ? 'pointer' : 'default',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
												maxWidth: '150px',
											}}
											title={username}
										>
											{displayUsername}
										</p>
									</div>
									<span
										data-mic-element={clientID}
										onClick={event => {
											// Check if microphone is disabled before handling click
											if (!isMicDisabled) {
												// Only toggle if not disabled
												handleToggleRemoteMic(clientID)

												// Add a visual feedback for the click
												const element = event.currentTarget
												element.style.transform = 'scale(0.9)'
												setTimeout(() => {
													element.style.transform = 'scale(1)'
												}, 100)
											}
										}}
										onWheel={event => {
											if (hoveredMicClientId === clientID) {
												handleVolumeWheel(event, clientID)
											}
										}}
										onMouseEnter={() => {
											// Don't set hover state if microphone is disabled
											if (isMicDisabled) return

											setHoveredMicClientId(clientID)

											// Добавляем визуальную подсказку о возможности прокрутки
											const volumeIndicator = document.querySelector(
												`[data-volume-indicator="${clientID}"]`
											)
											if (volumeIndicator) {
												volumeIndicator.classList.add('mic-hover')
												volumeIndicator.textContent = `${Math.round(
													getDisplayVolume(clientID) * 100
												)}% (прокрутите)`
											}
										}}
										onMouseLeave={() => {
											setHoveredMicClientId(null)

											// Удаляем визуальную подсказку
											const volumeIndicator = document.querySelector(
												`[data-volume-indicator="${clientID}"]`
											)
											if (volumeIndicator) {
												volumeIndicator.classList.remove('mic-hover')
												volumeIndicator.textContent = `${Math.round(
													getDisplayVolume(clientID) * 100
												)}%`
											}
										}}
										style={{
											color:
												clientID === localVideoId
													? isMicrophoneDisabled
														? 'rgba(247, 65, 101, 0.7)'
														: 'rgba(165, 247, 65, 0.7)'
													: participantInfo[clientID]?.isMicrophoneDisabled
													? 'rgba(247, 65, 101, 0.7)'
													: 'rgba(165, 247, 65, 0.7)',
											opacity: isMicDisabled ? 1 : getDisplayVolume(clientID) === 0 ? 0.3 : 1,
											cursor: isMicDisabled ? 'default' : 'pointer',
											position: 'relative',
											transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
										}}
										onMouseOver={e => {
											if (!isMicDisabled) {
												e.currentTarget.style.transform = 'scale(1.2)'
											}
										}}
										onMouseOut={e => {
											if (!isMicDisabled) {
												e.currentTarget.style.transform = 'scale(1)'
											}
										}}
										onMouseDown={e => {
											if (!isMicDisabled) {
												e.currentTarget.style.transform = 'scale(0.9)'
											}
										}}
										onMouseUp={e => {
											if (!isMicDisabled) {
												e.currentTarget.style.transform = 'scale(1.2)'
											}
										}}
									>
										{/* Only show cross icon if volume is 0 AND microphone is NOT disabled AND not currently unmuting */}
										{shouldShowMicCross(clientID) && (
											<ImCross
												style={{
													position: 'absolute',
													top: '0px',
													right: '0px',
													color: 'white',
													transform: 'scale(0.7)',
												}}
											/>
										)}
										{clientID === localVideoId ? (
											isMicrophoneDisabled ? (
												<FaMicrophoneAltSlash />
											) : (
												<div style={{ position: 'relative' }}>
													<FaMicrophoneAlt style={{ color: 'rgba(165, 247, 65, 0.7)' }} />
													{hoveredMicClientId === clientID &&
														getDisplayVolume(clientID) > 0 && (
															<div
																data-volume-indicator={clientID}
																style={{
																	position: 'absolute',
																	bottom: '17px',
																	left: '50%',
																	transform: 'translateX(-50%)',
																	backgroundColor: 'rgba(0, 0, 0, 0.7)',
																	color: 'white',
																	padding: '2px 6px',
																	borderRadius: '5px',
																	fontSize: '10px',
																	whiteSpace: 'nowrap',
																	transition: 'transform 0.2s ease',
																}}
															>
																{Math.round(getDisplayVolume(clientID) * 100)}%
															</div>
														)}
												</div>
											)
										) : participantInfo[clientID]?.isMicrophoneDisabled ? (
											<FaMicrophoneAltSlash />
										) : (
											<div style={{ position: 'relative' }}>
												<FaMicrophoneAlt style={{ color: 'rgba(165, 247, 65, 0.7)' }} />
												{hoveredMicClientId === clientID && getDisplayVolume(clientID) > 0 && (
													<div
														data-volume-indicator={clientID}
														style={{
															position: 'absolute',
															bottom: '17px',
															left: '50%',
															transform: 'translateX(-50%)',
															backgroundColor: 'rgba(0, 0, 0, 0.7)',
															color: 'white',
															padding: '2px 6px',
															borderRadius: '5px',
															fontSize: '10px',
															whiteSpace: 'nowrap',
															transition: 'transform 0.2s ease',
														}}
													>
														{Math.round(getDisplayVolume(clientID) * 100)}%
													</div>
												)}
											</div>
										)}
									</span>
									<span
										data-camera-element={clientID}
										onClick={event => {
											// Check if camera is disabled before handling click
											const isCamDisabled =
												participantInfo[clientID]?.isCameraDisabled ||
												(clientID === localVideoId && isCameraDisabled)

											if (!isCamDisabled) {
												toggleRemoteCamera(clientID)
												// Add a visual feedback for the click
												const element = event.currentTarget
												element.style.transform = 'scale(0.9)'
												setTimeout(() => {
													element.style.transform = 'scale(1)'
												}, 100)
											}
										}}
										onWheel={event => {
											// Allow wheel events on camera icon even when camera is off
											if (hoveredCameraClientId === clientID) {
												handleCameraOpacityWheel(event, clientID)
											}
										}}
										onMouseEnter={() => {
											// Don't set hover state if camera is disabled
											const isCamDisabled =
												participantInfo[clientID]?.isCameraDisabled ||
												(clientID === localVideoId && isCameraDisabled)

											if (isCamDisabled) return

											setHoveredCameraClientId(clientID)
										}}
										onMouseLeave={() => {
											setHoveredCameraClientId(null)
										}}
										style={{
											cursor:
												participantInfo[clientID]?.isCameraDisabled ||
												(clientID === localVideoId && isCameraDisabled)
													? 'default'
													: 'pointer',
											color:
												participantInfo[clientID]?.isCameraDisabled ||
												(clientID === localVideoId && isCameraDisabled)
													? 'rgba(247, 65, 101, 0.7)'
													: 'rgba(165, 247, 65, 0.7)',
											opacity: participantCameras[clientID] === false ? 0.3 : 1,
											position: 'relative',
											transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
										}}
										onMouseOver={e => {
											const isCamDisabled =
												participantInfo[clientID]?.isCameraDisabled ||
												(clientID === localVideoId && isCameraDisabled)

											if (!isCamDisabled) {
												e.currentTarget.style.transform = 'scale(1.2)'
											}
										}}
										onMouseOut={e => {
											const isCamDisabled =
												participantInfo[clientID]?.isCameraDisabled ||
												(clientID === localVideoId && isCameraDisabled)

											if (!isCamDisabled) {
												e.currentTarget.style.transform = 'scale(1)'
											}
										}}
										onMouseDown={e => {
											const isCamDisabled =
												participantInfo[clientID]?.isCameraDisabled ||
												(clientID === localVideoId && isCameraDisabled)

											if (!isCamDisabled) {
												e.currentTarget.style.transform = 'scale(0.9)'
											}
										}}
										onMouseUp={e => {
											const isCamDisabled =
												participantInfo[clientID]?.isCameraDisabled ||
												(clientID === localVideoId && isCameraDisabled)

											if (!isCamDisabled) {
												e.currentTarget.style.transform = 'scale(1.2)'
											}
										}}
									>
										{/* Only show cross icon if camera is off AND camera is NOT disabled */}
										{participantCameras[clientID] === false &&
											!(
												participantInfo[clientID]?.isCameraDisabled ||
												(clientID === localVideoId && isCameraDisabled)
											) && (
												<ImCross
													style={{
														position: 'absolute',
														top: '0px',
														right: '0px',
														color: 'white',
														transform: 'scale(0.7)',
													}}
												/>
											)}
										{participantInfo[clientID].isCameraDisabled ||
										(clientID === localVideoId && isCameraDisabled) ? (
											<BsCameraVideoOffFill />
										) : (
											<div style={{ position: 'relative' }}>
												<BsCameraVideoFill />
												{hoveredCameraClientId === clientID &&
													getDisplayCameraStatus(clientID) && (
														<div
															data-camera-indicator={clientID}
															style={{
																position: 'absolute',
																bottom: '17px',
																left: '50%',
																transform: 'translateX(-50%)',
																backgroundColor: 'rgba(0, 0, 0, 0.7)',
																color: 'white',
																padding: '2px 6px',
																borderRadius: '5px',
																fontSize: '10px',
																whiteSpace: 'nowrap',
																transition: 'transform 0.2s ease',
															}}
														>
															{Math.round(getDisplayCameraOpacity(clientID) * 100)}%
														</div>
													)}
											</div>
										)}
									</span>
									<button
										onClick={event => {
											togglePrivateChat(clientID)
											// Add a visual feedback for the click
											const element = event.currentTarget
											element.style.transform = 'scale(0.9)'
											setTimeout(() => {
												element.style.transform = 'scale(1)'
											}, 100)
										}}
										style={{
											background: 'none',
											border: 'none',
											cursor: 'pointer',
											color: 'white',
											padding: '5px',
											position: 'relative',
											transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
										}}
										onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.2)')}
										onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
										onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
										onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.2)')}
									>
										<IoChatbox
											style={{
												fill: 'white',
												position: 'relative',
												transform: 'scale(0.9)',
												paddingTop: '2px',
												zIndex: 99999,
												opacity: privateChats[clientID] ? 1 : 0.7,
											}}
										/>
										{privateChats[clientID] && (
											<IoChatbox
												style={{
													fill: 'rgba(165, 247, 65, 0.7)',
													position: 'absolute',
													transform: 'scale(1.15)',
													zIndex: 20,
													top: '8px',
													left: '5px',
													opacity: privateChats[clientID] ? 1 : 0.7,
												}}
											/>
										)}

										{unreadMessages[clientID] > 0 && (
											<div
												style={{
													zIndex: 999999,
													position: 'absolute',
													top: '23%',
													right: '29%',
													backgroundColor: 'rgba(247, 65, 101, 0.7)',
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
												{unreadMessages[clientID] > 99 ? '99' : unreadMessages[clientID]}
											</div>
										)}
									</button>
								</div>
							)
						})}
				</div>
			)}
		</>
	)
}
