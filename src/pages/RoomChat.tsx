'use client'

import { useRef, useEffect } from 'react'
import { Box, Flex, ScrollArea, Text, TextArea, Button, Avatar } from '@radix-ui/themes'
import { Kbd } from '@radix-ui/themes'
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
	}, [scrollAreaRef]) //Corrected dependency

	return (
		<DraggableResizable
			initialSize={{ width: 300, height: 400 }}
			initialPosition={{ x: window.innerWidth - 620, y: window.innerHeight - 470 }}
			bounds='.react-player'
			disableWheelZoomClass='scroll-area'
		>
			{({ isDragging }) => (
				<Box
					style={{
						backgroundColor: 'var(--gray-1)',
						borderRadius: 'var(--radius-3)',
						overflow: 'hidden',
						display: 'flex',
						flexDirection: 'column',
						boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
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
							borderBottom: '1px solid var(--gray-5)',
							cursor: isDragging ? 'grabbing' : 'move',
							backgroundColor: 'var(--gray-2)',
							userSelect: 'none',
						}}
					>
						<Text size='2' weight='bold'>
							Chat
						</Text>
						<Button variant='ghost' onClick={onClose}>
							X
						</Button>
					</Flex>

					<ScrollArea style={{ flex: 1, padding: '16px' }} ref={scrollAreaRef} className='scroll-area'>
						{messages.map((msg, index) => {
							const isCurrentUser = msg.sender === realClientID
							const isFirstMessageFromUser = index === 0 || messages[index - 1].sender !== msg.sender
							return (
								<Box key={index} mb='2' style={{ textAlign: isCurrentUser ? 'right' : 'left' }}>
									{isFirstMessageFromUser && !isCurrentUser && (
										<Flex align='center' mb='1' gap='2'>
											<Avatar
												src={participantInfo[msg.sender]?.avatar}
												fallback={msg.username[0]}
												size='1'
											/>
											<Text size='1' style={{ color: 'var(--gray-11)' }}>
												{msg.username}
											</Text>
										</Flex>
									)}
									<Text
										as='span'
										size='2'
										style={{
											display: 'inline-block',
											backgroundColor: isCurrentUser ? 'var(--blue-5)' : 'var(--gray-3)',
											color: isCurrentUser ? 'white' : 'var(--gray-12)',
											borderRadius: 'var(--radius-2)',
											padding: '4px 8px',
											maxWidth: '70%',
											wordWrap: 'break-word',
										}}
									>
										{msg.message}
									</Text>
								</Box>
							)
						})}
					</ScrollArea>

					<Flex p='3' style={{ borderTop: '1px solid var(--gray-5)' }}>
						<TextArea
							style={{ flex: 1, marginRight: '8px' }}
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
						<Button onClick={handleSendMessage}>
							<Kbd>Enter</Kbd>
						</Button>
					</Flex>
				</Box>
			)}
		</DraggableResizable>
	)
}

export default RoomChat
