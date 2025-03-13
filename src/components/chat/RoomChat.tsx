'use client'

import React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Box, Flex, ScrollArea, Text, TextArea, Button, Avatar } from '@radix-ui/themes'
import { MdKeyboardReturn } from 'react-icons/md'
import DraggableResizable from '../DraggableResizable'

// Add animation styles for the new messages indicator
const animationStyles = `@keyframes fadeIn {
from { opacity: 0; transform: translateY(10px); }
to { opacity: 1; transform: translateY(0); }
}`

const pulseAnimation = `  @keyframes pulse {
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
}`

interface RoomChatProps {
	realClientID: string | null
	participantInfo: Record<
		string,
		{ username: string; avatar: string; isCameraDisabled: boolean; isMicrophoneDisabled: boolean }
	>
	messages: Array<{ sender: string; username: string; message: string }>
	chatInput: string
	setChatInput: (input: string) => void
	handleSendMessage: () => void
	onClose: () => void
	onOpenPrivateChat: (clientID: string) => void
	onMouseEnter: (id: string) => void
	onMouseLeave: () => void
	isTyping: boolean
	setIsTyping: (isTyping: boolean) => void
}

const RoomChat: React.FC<RoomChatProps> = ({
	realClientID,
	participantInfo,
	messages,
	chatInput,
	setChatInput,
	handleSendMessage,
	onClose,
	onOpenPrivateChat,
	onMouseEnter,
	onMouseLeave,
	setIsTyping,
	isTyping,
}) => {
	const [isActive, setIsActive] = useState(true)
	const scrollAreaRef = useRef<HTMLDivElement>(null)
	const [isHovered, setIsHovered] = useState(false)
	// Add new state variables for scroll tracking
	const [isAtBottom, setIsAtBottom] = useState(true)
	const [hasNewMessages, setHasNewMessages] = useState(false)
	const [lastSeenMessageCount, setLastSeenMessageCount] = useState(0)
	const prevMessagesCountRef = useRef(messages.length)
	const [isAtTop, setIsAtTop] = useState(false)

	// State for tracking sequence start messages
	const [sequenceStartRefs, setSequenceStartRefs] = useState<Record<number, React.RefObject<HTMLDivElement>>>({})
	const [sequenceEndRefs, setSequenceEndRefs] = useState<Record<number, React.RefObject<HTMLDivElement>>>({})
	const [invisibleSequenceStartIndex, setInvisibleSequenceStartIndex] = useState<number | null>(null)
	const [showFloatingAvatar, setShowFloatingAvatar] = useState(false)
	const [floatingAvatarSender, setFloatingAvatarSender] = useState<string | null>(null)
	const [onlyLocalMessagesVisible, setOnlyLocalMessagesVisible] = useState(false)
	const [isPreviousUserAvatar, setIsPreviousUserAvatar] = useState(false)

	// Find all sequence start and end indices
	const findSequenceIndices = () => {
		const startIndices: number[] = []
		const endIndices: number[] = []

		messages.forEach((msg, index) => {
			if (msg.sender === realClientID) return // Skip messages from the current user

			// If this is the first message or the previous message was from a different sender
			if (index === 0 || messages[index - 1].sender !== msg.sender) {
				startIndices.push(index)
			}

			// If this is the last message or the next message is from a different sender
			if (index === messages.length - 1 || messages[index + 1].sender !== msg.sender) {
				endIndices.push(index)
			}
		})

		return { startIndices, endIndices }
	}

	// Find the previous sequence for a given sequence start index
	const findPreviousSequence = (currentStartIndex: number) => {
		const { startIndices } = findSequenceIndices()

		// Find the index of the current sequence in the startIndices array
		const currentSequenceIndex = startIndices.findIndex(index => index === currentStartIndex)

		// If this is the first sequence or not found, return null
		if (currentSequenceIndex <= 0) return null

		// Get the previous sequence start index
		const previousStartIndex = startIndices[currentSequenceIndex - 1]
		const previousSender = messages[previousStartIndex].sender

		return { startIndex: previousStartIndex, sender: previousSender }
	}

	// Find the visible sequences and return the most recent one
	const findVisibleSequence = (scrollAreaRect: DOMRect) => {
		const visibleSequences: { sender: string; startIndex: number }[] = []

		// Get all sequence indices
		const { startIndices } = findSequenceIndices()

		// Check each sequence for visibility
		for (const startIndex of startIndices) {
			const sender = messages[startIndex].sender
			if (sender === realClientID) continue

			// Check if any messages from this sequence are visible
			const hasVisibleMessages = messages.some((msg, idx) => {
				if (msg.sender !== sender) return false

				// Check if this message is part of the current sequence
				let isPartOfSequence = false
				for (let i = idx; i >= 0; i--) {
					if (messages[i].sender !== sender) break
					if (i === startIndex) {
						isPartOfSequence = true
						break
					}
				}

				if (!isPartOfSequence) return false

				const msgRef = document.querySelector(`.message-${idx}`)
				if (!msgRef) return false

				const msgRect = msgRef.getBoundingClientRect()
				return msgRect.top >= scrollAreaRect.top && msgRect.bottom <= scrollAreaRect.bottom
			})

			if (hasVisibleMessages) {
				visibleSequences.push({ sender, startIndex })
			}
		}

		// Return the most recent visible sequence
		if (visibleSequences.length > 0) {
			return visibleSequences[visibleSequences.length - 1]
		}

		return null
	}

	// Check if any non-local messages are visible
	const checkIfOnlyLocalMessagesVisible = (scrollAreaRect: DOMRect) => {
		// Check if any non-local messages are visible
		const anyNonLocalVisible = messages.some((msg, i) => {
			if (msg.sender === realClientID) return false

			const msgRef = document.querySelector(`.message-${i}`)
			if (!msgRef) return false

			const msgRect = msgRef.getBoundingClientRect()
			return msgRect.top >= scrollAreaRect.top && msgRect.bottom <= scrollAreaRect.bottom
		})

		// If no non-local messages are visible but there are some local messages visible
		const anyLocalVisible = messages.some((msg, i) => {
			if (msg.sender !== realClientID) return false

			const msgRef = document.querySelector(`.message-${i}`)
			if (!msgRef) return false

			const msgRect = msgRef.getBoundingClientRect()
			return msgRect.top >= scrollAreaRect.top && msgRect.bottom <= scrollAreaRect.bottom
		})

		return !anyNonLocalVisible && anyLocalVisible
	}

	// Get the last non-local sender
	const getLastNonLocalSender = () => {
		for (let i = messages.length - 1; i >= 0; i--) {
			if (messages[i].sender !== realClientID) {
				return messages[i].sender
			}
		}
		return null
	}

	// Modify the checkSequenceVisibility function to implement the chain of previous user avatars
	const checkSequenceVisibility = () => {
		if (messages.length === 0) return

		const scrollAreaRect = scrollAreaRef.current?.getBoundingClientRect()
		if (!scrollAreaRect) return

		// First check if only local messages are visible
		const onlyLocalVisible = checkIfOnlyLocalMessagesVisible(scrollAreaRect)
		setOnlyLocalMessagesVisible(onlyLocalVisible)

		if (onlyLocalVisible) {
			// Get the last non-local sender
			const lastNonLocalSender = getLastNonLocalSender()
			if (lastNonLocalSender) {
				// Find the first message of their last sequence
				const { startIndices } = findSequenceIndices()
				const lastSenderStartIndices = startIndices.filter(
					index => messages[index].sender === lastNonLocalSender
				)

				if (lastSenderStartIndices.length > 0) {
					const lastSequenceStartIndex = lastSenderStartIndices[lastSenderStartIndices.length - 1]

					// Check if the local user's messages are the first in the chat
					const localUserFirstInChat = messages.length > 0 && messages[0].sender === realClientID

					// Only show floating avatar if the local user's messages are not the first in the chat
					if (!localUserFirstInChat) {
						setInvisibleSequenceStartIndex(lastSequenceStartIndex)
						setFloatingAvatarSender(lastNonLocalSender)
						setShowFloatingAvatar(true)
						setIsPreviousUserAvatar(false)
						return
					}
				}
			}
		} else {
			// Find the currently visible sequence
			const visibleSequence = findVisibleSequence(scrollAreaRect)

			if (visibleSequence) {
				const { sender, startIndex } = visibleSequence

				// Check if the first message of the sequence is visible
				const startRef = sequenceStartRefs[startIndex]
				if (!startRef?.current) return

				const startRect = startRef.current.getBoundingClientRect()
				const isSequenceStartVisible =
					startRect.top >= scrollAreaRect.top && startRect.bottom <= scrollAreaRect.bottom

				if (!isSequenceStartVisible) {
					// If first message is NOT visible, show the current user's avatar
					setInvisibleSequenceStartIndex(startIndex)
					setFloatingAvatarSender(sender)
					setShowFloatingAvatar(true)
					setIsPreviousUserAvatar(false)
					return
				} else {
					// If first message IS visible, find the previous user's avatar
					// and continue finding previous users if their first messages are also visible
					let currentStartIndex = startIndex
					let previousSequence = findPreviousSequence(currentStartIndex)

					// Keep looking for previous sequences until we find one whose first message is not visible
					// or until we run out of previous sequences
					while (previousSequence) {
						const prevStartRef = sequenceStartRefs[previousSequence.startIndex]

						// If we don't have a ref for the previous sequence, use this one
						if (!prevStartRef?.current) {
							setInvisibleSequenceStartIndex(previousSequence.startIndex)
							setFloatingAvatarSender(previousSequence.sender)
							setShowFloatingAvatar(true)
							setIsPreviousUserAvatar(true)
							return
						}

						// Check if the first message of the previous sequence is visible
						const prevStartRect = prevStartRef.current.getBoundingClientRect()
						const isPrevSequenceStartVisible =
							prevStartRect.top >= scrollAreaRect.top && prevStartRect.bottom <= scrollAreaRect.bottom

						if (!isPrevSequenceStartVisible) {
							// If the previous sequence's first message is not visible, show its avatar
							setInvisibleSequenceStartIndex(previousSequence.startIndex)
							setFloatingAvatarSender(previousSequence.sender)
							setShowFloatingAvatar(true)
							setIsPreviousUserAvatar(true)
							return
						}

						// If the previous sequence's first message is visible, continue looking further back
						currentStartIndex = previousSequence.startIndex
						previousSequence = findPreviousSequence(currentStartIndex)
					}

					// If we've gone through all previous sequences and they're all visible,
					// don't show any floating avatar
					setShowFloatingAvatar(false)
					setInvisibleSequenceStartIndex(null)
					setFloatingAvatarSender(null)
					setIsPreviousUserAvatar(false)
					return
				}
			}
		}

		// If we get here, don't show the floating avatar
		setShowFloatingAvatar(false)
		setInvisibleSequenceStartIndex(null)
		setFloatingAvatarSender(null)
		setIsPreviousUserAvatar(false)
	}

	// Initialize refs for sequence start and end messages
	useEffect(() => {
		const { startIndices, endIndices } = findSequenceIndices()

		const newStartRefs: Record<number, React.RefObject<HTMLDivElement>> = {}
		startIndices.forEach(index => {
			if (!sequenceStartRefs[index]) {
				newStartRefs[index] = React.createRef<HTMLDivElement>()
			}
		})

		const newEndRefs: Record<number, React.RefObject<HTMLDivElement>> = {}
		endIndices.forEach(index => {
			if (!sequenceEndRefs[index]) {
				newEndRefs[index] = React.createRef<HTMLDivElement>()
			}
		})

		if (Object.keys(newStartRefs).length > 0) {
			setSequenceStartRefs(prev => ({ ...prev, ...newStartRefs }))
		}

		if (Object.keys(newEndRefs).length > 0) {
			setSequenceEndRefs(prev => ({ ...prev, ...newEndRefs }))
		}
	}, [messages, realClientID])

	// Modify the handleScroll function to check sequence visibility
	const handleScroll = () => {
		const filteredMessages = messages.filter(msg => msg.sender !== realClientID)
		const scrollArea = scrollAreaRef.current
		if (scrollArea) {
			const isScrolledToBottom = scrollArea.scrollHeight - scrollArea.scrollTop <= scrollArea.clientHeight + 10 // Add a small buffer
			const isScrolledToTop = scrollArea.scrollTop <= 10 // Add a small buffer for "at top" detection

			setIsAtBottom(isScrolledToBottom)
			setIsAtTop(isScrolledToTop)

			// When user scrolls to bottom, update the last seen message count
			if (isScrolledToBottom) {
				setLastSeenMessageCount(filteredMessages.length)
				setHasNewMessages(false)
				setShowFloatingAvatar(false)
			}

			// Check if sequence messages are visible
			checkSequenceVisibility()
		}
	}

	// Check visibility when messages or refs change
	useEffect(() => {
		if (
			messages.length > 0 &&
			Object.keys(sequenceStartRefs).length > 0 &&
			Object.keys(sequenceEndRefs).length > 0
		) {
			// Wait for refs to be attached
			setTimeout(() => {
				checkSequenceVisibility()
			}, 100)
		}
	}, [messages, sequenceStartRefs, sequenceEndRefs])

	useEffect(() => {
		if (!isTyping && !isHovered) {
			setIsActive(false)
		}
	}, [isHovered, isTyping])

	// Effect to scroll to bottom when chat opens
	useEffect(() => {
		const scrollArea = scrollAreaRef.current
		if (scrollArea) {
			scrollArea.scrollTop = scrollArea.scrollHeight
		}
	}, []) // Empty dependency array ensures this runs only once when component mounts

	// Effect to handle new messages and scrolling
	useEffect(() => {
		const scrollArea = scrollAreaRef.current
		const filteredMessages = messages.filter(msg => msg.sender !== realClientID)
		if (scrollArea) {
			if (isAtBottom) {
				// Only scroll if there are new messages to avoid unnecessary scrolling
				const currentMessagesCount = messages.length

				if (currentMessagesCount > prevMessagesCountRef.current) {
					const scrollTimeout = setTimeout(() => {
						scrollArea.scrollTop = scrollArea.scrollHeight
					}, 0)

					// Update last seen count when at bottom
					setLastSeenMessageCount(filteredMessages.length)
					setHasNewMessages(false)

					// Update reference for next comparison
					prevMessagesCountRef.current = currentMessagesCount

					return () => clearTimeout(scrollTimeout)
				}
			} else {
				// Only show new messages indicator if there are actually new messages
				// since the last time user was at the bottom
				if (filteredMessages.length > lastSeenMessageCount) {
					setHasNewMessages(true)
				}
			}
		}
	}, [messages, isAtBottom, lastSeenMessageCount, realClientID])

	// Add animation styles to document
	useEffect(() => {
		const styleElement = document.createElement('style')
		styleElement.innerHTML = animationStyles + pulseAnimation
		document.head.appendChild(styleElement)

		return () => {
			document.head.removeChild(styleElement)
		}
	}, [])

	const getMessageClasses = (message: { sender: string }, index: number) => {
		const prevMessage = messages[index - 1]
		const nextMessage = messages[index + 1]

		const isFirst = !prevMessage || prevMessage.sender !== message.sender
		const isLast = !nextMessage || nextMessage.sender !== message.sender

		return `message ${isFirst ? 'message-first' : ''} ${isLast ? 'message-last' : ''}`
	}

	// Determine if a message is the start or end of a sequence
	const isSequenceStart = (index: number) => {
		return index === 0 || messages[index - 1].sender !== messages[index].sender
	}

	const isSequenceEnd = (index: number) => {
		return index === messages.length - 1 || messages[index + 1].sender !== messages[index].sender
	}

	// Handle avatar click to scroll to the appropriate message
	const handleAvatarClick = () => {
		if (invisibleSequenceStartIndex !== null && sequenceStartRefs[invisibleSequenceStartIndex]?.current) {
			const scrollArea = scrollAreaRef.current
			if (!scrollArea) return

			// First, scroll to the message to get its position
			sequenceStartRefs[invisibleSequenceStartIndex].current?.scrollIntoView({ behavior: 'auto' })
			scrollArea.scrollBy({ top: -5, behavior: 'smooth' }) // Scroll up by 5 pixels to show more context
		}
	}

	// Handle scroll to bottom click
	const handleScrollToBottom = () => {
		const scrollArea = scrollAreaRef.current
		if (scrollArea) {
			scrollArea.scrollTop = scrollArea.scrollHeight
		}
	}

	return (
		<DraggableResizable
			initialSize={{ width: 320, height: 480 }}
			initialPosition={{ x: window.innerWidth - 640, y: window.innerHeight - 550 }}
			disableWheelZoomClass='scroll-area'
			bounds='parent'
			focused={isActive}
		>
			{({ isDragging }) => (
				<Box
					onMouseEnter={() => {
						setIsActive(true)
						setIsHovered(true)
					}}
					onMouseLeave={() => (isTyping ? setIsHovered(false) : setIsActive(false))}
					style={{
						backgroundColor: 'var(--gray-1)',
						borderRadius: 'var(--radius-4)',
						overflow: 'hidden',
						zIndex: isActive ? 2147483647 : 12000,
						display: 'flex',
						flexDirection: 'column',
						width: '100%',
						height: '100%',
						boxShadow: isActive ? '0 8px 30px rgba(0, 0, 0, 0.12)' : '0 5px 15px rgba(0, 0, 0, 0.08)',
						transition: 'box-shadow 0.3s ease, opacity 0.3s ease',
						opacity: isActive ? 1 : 0.85,
						border: '1px solid',
						borderColor: isActive ? 'var(--gray-5)' : 'var(--gray-4)',
					}}
				>
					<Flex
						align='center'
						justify='between'
						p='3'
						className='drag-handle'
						style={{
							borderBottom: '1px solid var(--gray-4)',
							cursor: isDragging ? 'grabbing' : 'move',
							backgroundColor: isActive ? 'var(--gray-2)' : 'rgba(245, 245, 245, 0.9)',
							userSelect: 'none',
							transition: 'background-color 0.3s ease',
						}}
					>
						<Text
							size='2'
							weight='bold'
							style={{
								opacity: isActive ? 0.8 : 0.8,
								transition: 'opacity 0.3s ease',
							}}
						>
							Room Chat
						</Text>
						<Button
							variant='ghost'
							onMouseDown={onClose}
							style={{
								color: 'black',
								fontWeight: 'bold',
								cursor: 'pointer',
								opacity: isActive ? 0.8 : 0.8,
								transition: 'opacity 0.2s ease, background-color 0.2s ease',
								borderRadius: '50%',
								width: '28px',
								height: '28px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								padding: 0,
							}}
							onMouseEnter={e => {
								e.currentTarget.style.backgroundColor = 'rgba(247, 65, 101, 0.7)'
								e.currentTarget.style.opacity = '1'
							}}
							onMouseLeave={e => {
								e.currentTarget.style.backgroundColor = 'transparent'
								e.currentTarget.style.opacity = isActive ? '0.8' : '0.5'
							}}
						>
							✕
						</Button>
					</Flex>
					<ScrollArea
						style={{
							flex: 1,
							padding: '16px',
							paddingBottom: '0px',
							background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(250,250,250,0.98))',
						}}
						ref={scrollAreaRef}
						className='scroll-area'
						scrollbars='vertical'
						onScroll={handleScroll}
					>
						{messages.map((msg, index) => {
							// Determine if this is the start or end of a sequence
							const isStart = isSequenceStart(index)
							const isEnd = isSequenceEnd(index)

							return (
								<Box
									key={index}
									className={`message message-${index} ${getMessageClasses(msg, index)}`}
									style={{
										textAlign: msg.sender === realClientID ? 'right' : 'left',
										marginBottom: '8px',
									}}
									ref={
										msg.sender !== realClientID
											? isStart
												? sequenceStartRefs[index] || null
												: isEnd
												? sequenceEndRefs[index] || null
												: null
											: null
									}
								>
									<Flex align='end' gap='2' justify={msg.sender === realClientID ? 'end' : 'start'}>
										{msg.sender !== realClientID && (
											<div style={{ position: 'relative' }}>
												<Avatar
													onMouseEnter={() => onMouseEnter(msg.sender)}
													onMouseLeave={onMouseLeave}
													src={participantInfo[msg.sender]?.avatar}
													fallback={participantInfo[msg.sender]?.username[0]}
													size='1'
													style={{
														marginBottom: '4px',
														opacity: getMessageClasses(msg, index).includes('message-first')
															? 1
															: 0,
														visibility: getMessageClasses(msg, index).includes(
															'message-first'
														)
															? 'visible'
															: 'hidden',
														cursor: 'pointer',
														transition: 'opacity 0.3s ease',
														borderRadius: '0px',
													}}
													onClick={() => onOpenPrivateChat(msg.sender)}
													title={`Open private chat with ${
														participantInfo[msg.sender]?.username
													}`}
												/>
											</div>
										)}
										<Box
											style={{
												maxWidth: '85%',
												wordBreak: 'break-word',
											}}
										>
											<Text
												as='span'
												size='2'
												style={{
													display: 'inline-block',
													backgroundColor:
														msg.sender === realClientID
															? 'rgba(65, 150, 247, 0.75)'
															: 'var(--gray-3)',
													color: msg.sender === realClientID ? 'white' : 'var(--gray-12)',
													border: '3px solid rgba(0, 0, 0, 0.1)',
													borderRadius:
														msg.sender === realClientID
															? getMessageClasses(msg, index).includes('message-last')
																? '18px 18px 0 18px'
																: '18px 18px 4px 18px'
															: getMessageClasses(msg, index).includes('message-last')
															? '18px 18px 18px 0'
															: '18px 18px 18px 4px',
													padding: '8px 12px',
													whiteSpace: 'pre-wrap',
													boxShadow:
														msg.sender === realClientID
															? '0 2px 5px rgba(0, 0, 0, 0.1)'
															: '0 2px 5px rgba(0, 0, 0, 0.05)',
													transition: 'transform 0.2s ease, opacity 0.2s ease',
												}}
											>
												{msg.message}
											</Text>
										</Box>
									</Flex>
								</Box>
							)
						})}
					</ScrollArea>

					{/* Floating avatar or scroll to bottom button */}
					{showFloatingAvatar &&
						!isAtTop &&
						floatingAvatarSender &&
						participantInfo[floatingAvatarSender] && (
							<Box
								style={{
									position: 'absolute',
									top: '60px',
									left: '42%',
									transform: 'translateX(-50%)',
									zIndex: 20,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									padding: '4px 8px',
									borderRadius: '999px',
									backgroundColor: 'rgba(255, 255, 255, 0.9)',
									boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
									animation: 'pulse 1.5s infinite',
								}}
							>
								<Avatar
									src={participantInfo[floatingAvatarSender]?.avatar}
									fallback={participantInfo[floatingAvatarSender]?.username[0]}
									size='2'
									onClick={handleAvatarClick}
									style={{
										cursor: 'pointer',
										borderRadius: '0px',
									}}
									title={
										onlyLocalMessagesVisible
											? `${participantInfo[floatingAvatarSender]?.username} was the last person to send a message. Click to see their messages.`
											: isPreviousUserAvatar
											? `${participantInfo[floatingAvatarSender]?.username}'s messages came before this sequence. Click to see them.`
											: `${participantInfo[floatingAvatarSender]?.username}'s first message is not visible. Click to scroll to it.`
									}
								/>
							</Box>
						)}

					{/* Scroll to bottom button in the same position as floating avatar */}
					{isAtTop && !hasNewMessages && (
						<Box
							style={{
								position: 'absolute',
								top: '60px',
								left: '42%',
								transform: 'translateX(-50%)',
								zIndex: 20,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								padding: '4px 8px',
								borderRadius: '999px',
								backgroundColor: 'rgba(255, 255, 255, 0.9)',
								boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
								animation: 'pulse 1.5s infinite',
							}}
						>
							<Button
								size='1'
								variant='ghost'
								onClick={handleScrollToBottom}
								style={{
									borderRadius: '999px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: '42px',
									height: '42px',
									padding: '0',
									cursor: 'pointer',
									border: '2px solid var(--gray-4)',
								}}
								title='Scroll to bottom'
							>
								<svg
									width='16'
									height='16'
									viewBox='0 0 24 24'
									fill='none'
									xmlns='http://www.w3.org/2000/svg'
								>
									<path d='M12 16L6 10H18L12 16Z' fill='currentColor' />
								</svg>
							</Button>
						</Box>
					)}

					{/* Add new messages indicator */}
					{!isAtBottom && (
						<Flex
							justify='center'
							style={{
								position: 'absolute',
								bottom: '110px',
								left: 0,
								right: 0,
								zIndex: 10,
							}}
						>
							<Button
								size='1'
								variant='soft'
								onClick={handleScrollToBottom}
								style={{
									borderRadius: '999px',
									boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
									display: 'flex',
									alignItems: 'center',
									gap: '4px',
									padding: '6px 12px',
									animation: 'fadeIn 0.3s ease, pulse 1.5s infinite',
									cursor: 'pointer',
								}}
							>
								<svg
									width='16'
									height='16'
									viewBox='0 0 24 24'
									fill='none'
									xmlns='http://www.w3.org/2000/svg'
								>
									<path d='M12 16L6 10H18L12 16Z' fill='currentColor' />
								</svg>
								{!hasNewMessages ? 'Scroll to bottom' : 'New messages'}
							</Button>
						</Flex>
					)}

					<Flex
						p='3'
						gap='2'
						style={{
							borderTop: '1px solid var(--gray-4)',
							backgroundColor: isActive ? 'var(--gray-1)' : 'rgba(245, 245, 245, 0.9)',
							transition: 'background-color 0.3s ease',
						}}
					>
						<TextArea
							onFocus={() => setIsTyping(true)}
							onBlur={() => setIsTyping(false)}
							style={{
								flex: 1,
								transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
								borderColor: isActive ? 'var(--gray-6)' : 'var(--gray-5)',
								boxShadow: isActive ? '0 0 0 1px rgba(0, 0, 0, 0.05)' : 'none',
							}}
							placeholder='Type a message...'
							value={chatInput}
							onChange={e => setChatInput(e.target.value)}
							onKeyPress={e => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault()
									handleSendMessage()
								}
							}}
						/>
						<Button
							onClick={handleSendMessage}
							size='3'
							style={{
								padding: '30px 12px',
								opacity: chatInput.trim() ? 0.8 : 0.5,
								transition: 'opacity 0.3s ease',
								backgroundColor: 'transparent',
								cursor: chatInput.trim() ? 'pointer' : 'default',
								transform: 'scale(1.25)',
							}}
						>
							<MdKeyboardReturn
								size={18}
								style={{
									color: 'black',
									opacity: '0.8',
								}}
							/>
						</Button>
					</Flex>
				</Box>
			)}
		</DraggableResizable>
	)
}
export default RoomChat
