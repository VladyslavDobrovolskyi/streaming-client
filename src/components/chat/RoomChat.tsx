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

	// Replace the state variables for tracking the last message sender with these variables for tracking the first message
	const [firstMessageRefs, setFirstMessageRefs] = useState<Record<string, React.RefObject<HTMLDivElement>>>({})
	const [invisibleFirstMessageSender, setInvisibleFirstMessageSender] = useState<string | null>(null)
	const [showFloatingAvatar, setShowFloatingAvatar] = useState(false)

	// Replace the checkLastMessageVisibility function with this function to check first message visibility
	const checkFirstMessageVisibility = () => {
		if (messages.length === 0) return

		// Create a map to track the first message from each sender
		const firstMessageSenders = new Map<string, number>()

		// Find the first message index for each sender
		messages.forEach((msg, index) => {
			if (msg.sender !== realClientID && !firstMessageSenders.has(msg.sender)) {
				firstMessageSenders.set(msg.sender, index)
			}
		})

		// Get the last message sender (who is not the current user)
		const lastMessages = [...messages].reverse()
		const lastMessageSender = lastMessages.find(msg => msg.sender !== realClientID)?.sender

		// Check if any first messages are out of view
		let foundInvisibleSender = false

		firstMessageSenders.forEach((index, sender) => {
			const ref = firstMessageRefs[sender]
			if (!ref || !ref.current) return

			const rect = ref.current.getBoundingClientRect()
			const scrollAreaRect = scrollAreaRef.current?.getBoundingClientRect()
			if (!scrollAreaRect) return

			// Check if this first message is out of view (scrolled up)
			const isVisible = rect.top >= scrollAreaRect.top && rect.bottom <= scrollAreaRect.bottom

			// If not visible and we're currently showing messages from this sender
			if (!isVisible) {
				// Check if there are visible messages from this sender
				const hasVisibleMessages = messages.some((msg, i) => {
					if (msg.sender !== sender) return false
					if (i <= index) return false // Skip the first message we already checked

					// For subsequent messages from this sender, check if they're visible
					const msgRef = document.querySelector(`.message-${i}`)
					if (!msgRef) return false

					const msgRect = msgRef.getBoundingClientRect()
					return msgRect.top >= scrollAreaRect.top && msgRect.bottom <= scrollAreaRect.bottom
				})

				// Show the avatar if:
				// 1. There are visible messages from this sender AND
				// 2. This sender is also the last person who sent a message
				if (hasVisibleMessages && !foundInvisibleSender && sender === lastMessageSender) {
					setInvisibleFirstMessageSender(sender)
					setShowFloatingAvatar(true)
					foundInvisibleSender = true
				}
			}
		})

		if (!foundInvisibleSender) {
			setShowFloatingAvatar(false)
			setInvisibleFirstMessageSender(null)
		}
	}

	// Add this effect to initialize refs for first messages
	useEffect(() => {
		const newRefs: Record<string, React.RefObject<HTMLDivElement>> = {}
		const firstMessageSenders = new Set<string>()

		messages.forEach(msg => {
			if (msg.sender !== realClientID && !firstMessageSenders.has(msg.sender)) {
				firstMessageSenders.add(msg.sender)
				if (!firstMessageRefs[msg.sender]) {
					newRefs[msg.sender] = React.createRef<HTMLDivElement>()
				}
			}
		})

		if (Object.keys(newRefs).length > 0) {
			setFirstMessageRefs(prev => ({ ...prev, ...newRefs }))
		}
	}, [messages, realClientID])

	// Modify the handleScroll function to check first message visibility instead of last message
	const handleScroll = () => {
		const filteredMessages = messages.filter(msg => msg.sender !== realClientID)
		const scrollArea = scrollAreaRef.current
		if (scrollArea) {
			const isScrolledToBottom = scrollArea.scrollHeight - scrollArea.scrollTop <= scrollArea.clientHeight + 10 // Add a small buffer
			setIsAtBottom(isScrolledToBottom)

			// When user scrolls to bottom, update the last seen message count
			if (isScrolledToBottom) {
				setLastSeenMessageCount(filteredMessages.length)
				setHasNewMessages(false)
				setShowFloatingAvatar(false)
			}

			// Check if first messages are visible
			checkFirstMessageVisibility()
		}
	}

	// Replace the useEffect that checks message visibility
	useEffect(() => {
		if (messages.length > 0 && Object.keys(firstMessageRefs).length > 0) {
			// Wait for refs to be attached
			setTimeout(() => {
				checkFirstMessageVisibility()
			}, 100)
		}
	}, [messages, firstMessageRefs])

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
							// Determine if this is the first message from this sender
							const isFirstFromSender = messages.findIndex(m => m.sender === msg.sender) === index

							return (
								<Box
									key={index}
									className={`message message-${index} ${getMessageClasses(msg, index)}`}
									style={{
										textAlign: msg.sender === realClientID ? 'right' : 'left',
										marginBottom: '8px',
									}}
									ref={
										msg.sender !== realClientID && isFirstFromSender
											? firstMessageRefs[msg.sender] || null
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
					{showFloatingAvatar &&
						invisibleFirstMessageSender &&
						participantInfo[invisibleFirstMessageSender] && (
							<Box
								style={{
									position: 'absolute',
									top: '60px',
									left: '50%',
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
									src={participantInfo[invisibleFirstMessageSender]?.avatar}
									fallback={participantInfo[invisibleFirstMessageSender]?.username[0]}
									size='2'
									onClick={() => {
										// Find the first message from this sender
										const firstMessageIndex = messages.findIndex(
											msg => msg.sender === invisibleFirstMessageSender
										)
										if (
											firstMessageIndex >= 0 &&
											firstMessageRefs[invisibleFirstMessageSender]?.current
										) {
											// Scroll to the first message
											firstMessageRefs[invisibleFirstMessageSender].current?.scrollIntoView({
												behavior: 'smooth',
											})
											setTimeout(() => {
												setShowFloatingAvatar(false)
											}, 500)
										}
									}}
									style={{
										cursor: 'pointer',
										border: '2px solid var(--gray-4)',
									}}
									title={`${participantInfo[invisibleFirstMessageSender]?.username}'s first message is not visible. Click to scroll to it.`}
								/>
							</Box>
						)}
					{/* Add new messages indicator */}
					{hasNewMessages && !isAtBottom && (
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
								onClick={() => {
									const scrollArea = scrollAreaRef.current
									if (scrollArea) {
										scrollArea.scrollTop = scrollArea.scrollHeight
										setLastSeenMessageCount(
											messages.filter(msg => msg.sender !== realClientID).length
										)
										setHasNewMessages(false)
									}
								}}
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
								New messages
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
