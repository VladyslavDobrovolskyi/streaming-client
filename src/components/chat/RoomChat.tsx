'use client'

import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Box, Flex, ScrollArea, Text, TextArea, Button, Avatar } from '@radix-ui/themes'
import { MdKeyboardReturn } from 'react-icons/md'
import DraggableResizable from '../DraggableResizable'

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
}) => {
	const [isActive, setIsActive] = useState(true)
	const scrollAreaRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
		}
	}, [messages])

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
		>
			{({ isDragging }) => (
				<Box
					onMouseEnter={() => setIsActive(true)}
					onMouseLeave={() => setIsActive(false)}
					style={{
						backgroundColor: 'var(--gray-1)',
						borderRadius: 'var(--radius-4)',
						overflow: 'hidden',
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
							background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(250,250,250,0.98))',
						}}
						ref={scrollAreaRef}
						className='scroll-area'
						scrollbars='vertical'
					>
						{messages.map((msg, index) => (
							<Box
								key={index}
								className={getMessageClasses(msg, index)}
								style={{
									textAlign: msg.sender === realClientID ? 'right' : 'left',
									marginBottom: '8px',
								}}
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
													visibility: getMessageClasses(msg, index).includes('message-first')
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
						))}
					</ScrollArea>
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
