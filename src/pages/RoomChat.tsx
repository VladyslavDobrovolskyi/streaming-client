'use client'

import { useRef, useEffect } from 'react'
import { Box, Flex, ScrollArea, Text, TextArea, Button, Avatar } from '@radix-ui/themes'
import { Send } from 'lucide-react'
import DraggableResizable from './DraggableResizable'

interface RoomChatProps {
	realClientID: string | null
	participantInfo: Record<
		string,
		{ username: string; avatar: string; isCameraDisabled: boolean; isMicrophoneDisabled: boolean }
	>
	messages: { sender: string; username: string; message: string }[]
	chatInput: string
	setChatInput: (input: string) => void
	handleSendMessage: () => void
	onClose: () => void
}

const RoomChat: React.FC<RoomChatProps> = ({
	realClientID,
	participantInfo,
	messages,
	chatInput,
	setChatInput,
	handleSendMessage,
	onClose,
}) => {
	const scrollAreaRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
		}
	}, [scrollAreaRef]) //Fixed useEffect dependency

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
						<Button variant='ghost' onClick={onClose}>
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
								mb='3'
								style={{ textAlign: msg.sender === realClientID ? 'right' : 'left' }}
							>
								<Flex align='end' gap='2' justify={msg.sender === realClientID ? 'end' : 'start'}>
									{msg.sender !== realClientID && (
										<Avatar
											src={participantInfo[msg.sender]?.avatar}
											fallback={participantInfo[msg.sender]?.username[0]}
											size='1'
											style={{ marginBottom: '4px' }}
										/>
									)}
									<Box>
										{msg.sender !== realClientID && (
											<Text
												size='1'
												style={{ opacity: 0.7, marginBottom: '2px', paddingLeft: '4px' }}
											>
												{participantInfo[msg.sender]?.username}
											</Text>
										)}
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
														? '18px 18px 0 18px'
														: '18px 18px 18px 0',
												padding: '8px 12px',
												maxWidth: '85%',
												wordWrap: 'break-word',
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
						<Button onClick={handleSendMessage} size='3' style={{ padding: '0 16px' }}>
							<Send size={18} />
						</Button>
					</Flex>
				</Box>
			)}
		</DraggableResizable>
	)
}

export default RoomChat
