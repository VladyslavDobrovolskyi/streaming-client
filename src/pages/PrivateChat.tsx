'use client'

import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Box, Flex, ScrollArea, Text, TextArea, Button, Avatar } from '@radix-ui/themes'
import { Send } from 'lucide-react'
import DraggableResizable from './DraggableResizable'

interface PrivateChatProps {
	onMouseEnter: (id: string) => void
	onMouseLeave: () => void
	recipientId: string
	recipientName: string
	recipientAvatar: string
	onClose: () => void
	sendPrivateMessage: (params: { to: string; message: string }) => void
	privateMessages: Array<{ from: string; to: string; message: string }>
	realClientID: string
	highlight: boolean
}

const PrivateChat: React.FC<PrivateChatProps> = ({
	onMouseEnter,
	onMouseLeave,
	recipientId,
	recipientName,
	recipientAvatar,
	onClose,
	sendPrivateMessage,
	privateMessages,
	realClientID,
	highlight,
}) => {
	const [message, setMessage] = useState('')
	const scrollAreaRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
		}
	}, [scrollAreaRef.current]) // Updated dependency

	useEffect(() => {
		console.log(privateMessages)
	}, [privateMessages])
	const handleSend = () => {
		if (message.trim()) {
			sendPrivateMessage({ to: recipientId, message })
			setMessage('')
		}
	}

	const getMessageClasses = (message: { from: string }, index: number) => {
		const prevMessage = privateMessages[index - 1]
		const nextMessage = privateMessages[index + 1]

		const isFirst = !prevMessage || prevMessage.from !== message.from
		const isLast = !nextMessage || nextMessage.from !== message.from

		return `message ${isFirst ? 'message-first' : ''} ${isLast ? 'message-last' : ''}`
	}

	return (
		<DraggableResizable
			initialSize={{ width: 320, height: 480 }}
			initialPosition={{ x: window.innerWidth - 620, y: window.innerHeight - 550 }}
			disableWheelZoomClass='scroll-area'
			bounds='parent'
		>
			{({ isDragging }) => (
				<Box
					onMouseEnter={onMouseEnter.bind(null, recipientId)}
					onMouseLeave={onMouseLeave}
					style={{
						backgroundColor: 'var(--gray-1)',
						borderRadius: 'var(--radius-4)',
						overflow: 'hidden',
						display: 'flex',
						flexDirection: 'column',
						boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
						width: '100%',
						height: '100%',
						border: highlight ? '3px solid cyan' : '3px solid transparent',
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
						<Flex align='center' gap='2'>
							<Avatar src={recipientAvatar} fallback={recipientName[0]} size='2' />
							<Text size='2' weight='bold'>
								{recipientName}
							</Text>
						</Flex>
						<Button
							variant='ghost'
							onClick={() => {
								onClose()
								onMouseLeave()
							}}
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
						{privateMessages.map((msg, index) => (
							<Box
								key={index}
								className={getMessageClasses(msg, index)}
								style={{
									textAlign: msg.from === realClientID ? 'right' : 'left',
									marginBottom: '8px',
								}}
							>
								<Box
									style={{
										maxWidth: '85%',
										wordBreak: 'break-word',
										display: 'inline-block',
									}}
								>
									<Text
										as='span'
										size='2'
										style={{
											display: 'inline-block',
											backgroundColor:
												msg.from === realClientID ? 'var(--blue-9)' : 'var(--gray-3)',
											color: msg.from === realClientID ? 'white' : 'var(--gray-12)',
											borderRadius:
												msg.from === realClientID
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
							</Box>
						))}
					</ScrollArea>
					<Flex p='3' gap='2' style={{ borderTop: '1px solid var(--gray-4)' }}>
						<TextArea
							style={{ flex: 1 }}
							placeholder='Type a message...'
							value={message}
							onChange={e => setMessage(e.target.value)}
							onKeyPress={e => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault()
									handleSend()
								}
							}}
						/>
						<Button onClick={handleSend} size='3' style={{ padding: '0 16px' }}>
							<Send size={18} />
						</Button>
					</Flex>
				</Box>
			)}
		</DraggableResizable>
	)
}

export default PrivateChat
