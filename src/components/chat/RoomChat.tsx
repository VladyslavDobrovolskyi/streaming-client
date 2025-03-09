'use client'

import type React from 'react'
import { useRef, useEffect } from 'react'
import { Box, Flex, ScrollArea, Text, TextArea, Button, Avatar } from '@radix-ui/themes'
import { Send } from 'lucide-react'
// Удалите эту строку
//import { Tooltip } from "react-tooltip"
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
	const scrollAreaRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
		}
	}, [scrollAreaRef])

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
					style={{
						backgroundColor: 'var(--gray-1)',
						borderRadius: 'var(--radius-4)',
						overflow: 'hidden',
						display: 'flex',
						flexDirection: 'column',
						boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
						width: '100%',
						height: '100%',
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
							backgroundColor: 'var(--gray-2)',
							userSelect: 'none',
						}}
					>
						<Text size='2' weight='bold'>
							Room Chat
						</Text>
						<Button
							variant='ghost'
							onClick={onClose}
							style={{
								color: 'black',
								fontWeight: 'bold',
								cursor: 'pointer',
							}}
							onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(247, 65, 101, 0.7)')}
							onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
						>
							✕
						</Button>
					</Flex>
					<ScrollArea
						style={{ flex: 1, padding: '16px' }}
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
													cursor: 'pointer', // Добавляем курсор-указатель для обозначения кликабельности
												}}
												onClick={() => onOpenPrivateChat(msg.sender)} // Добавляем обработчик клика
												title={`Open private chat with ${
													participantInfo[msg.sender]?.username
												}`} // Добавляем подсказку
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
													msg.sender === realClientID ? 'var(--blue-9)' : 'var(--gray-3)',
												color: msg.sender === realClientID ? 'white' : 'var(--gray-12)',
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
											}}
										>
											{msg.message}
										</Text>
									</Box>
								</Flex>
							</Box>
						))}
					</ScrollArea>
					<Flex p='3' gap='2' style={{ borderTop: '1px solid var(--gray-4)' }}>
						<TextArea
							style={{ flex: 1 }}
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
						<Button onMouseDown={handleSendMessage} size='3' style={{ padding: '30px 12px' }}>
							<Send size={18} />
						</Button>
					</Flex>
				</Box>
			)}
		</DraggableResizable>
	)
}

export default RoomChat
