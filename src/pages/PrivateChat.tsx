'use client'

import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Box, Flex, ScrollArea, Text, TextArea, Button, Avatar } from '@radix-ui/themes'
import DraggableResizable from './DraggableResizable'

interface PrivateChatProps {
	recipientId: string
	recipientName: string
	recipientAvatar: string
	onClose: () => void
	sendPrivateMessage: (params: { to: string; message: string }) => void
	privateMessages: Array<{ from: string; to: string; message: string }>
}

const PrivateChat: React.FC<PrivateChatProps> = ({
	recipientId,
	recipientName,
	recipientAvatar,
	onClose,
	sendPrivateMessage,
	privateMessages,
}) => {
	const [message, setMessage] = useState('')
	const scrollAreaRef = useRef<HTMLDivElement>(null)
	const [scale, setScale] = useState(1)

	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
		}
	}, [scrollAreaRef]) //Corrected dependency

	const handleSend = () => {
		if (message.trim()) {
			sendPrivateMessage({ to: recipientId, message })
			setMessage('')
		}
	}

	const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
		e.preventDefault()
		const scaleFactor = 0.1
		const newScale = e.deltaY > 0 ? scale * (1 - scaleFactor) : scale * (1 + scaleFactor)
		setScale(Math.min(Math.max(newScale, 0.5), 2))
	}

	return (
		<DraggableResizable
			initialSize={{ width: 300, height: 400 }}
			initialPosition={{ x: window.innerWidth - 620, y: window.innerHeight - 470 }}
			bounds='parent'
		>
			{({ isDragging }) => (
				<Box
					onWheel={handleWheel}
					style={{
						backgroundColor: 'var(--gray-1)',
						borderRadius: 'var(--radius-3)',
						overflow: 'hidden',
						display: 'flex',
						flexDirection: 'column',
						boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
						transform: `scale(${scale})`,
						transformOrigin: 'center',
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
						<Flex align='center' gap='2'>
							<Avatar src={recipientAvatar} fallback={recipientName[0]} size='2' />
							<Text size='2' weight='bold'>
								{recipientName}
							</Text>
						</Flex>
						<Button variant='ghost' onClick={onClose}>
							X
						</Button>
					</Flex>
					<ScrollArea style={{ flex: 1, padding: '16px' }} ref={scrollAreaRef}>
						{privateMessages.map((msg, index) => (
							<Box key={index} mb='2' style={{ textAlign: msg.from === recipientId ? 'left' : 'right' }}>
								<Text
									as='span'
									size='2'
									style={{
										display: 'inline-block',
										backgroundColor: msg.from === recipientId ? 'var(--gray-3)' : 'var(--blue-5)',
										color: msg.from === recipientId ? 'var(--gray-12)' : 'white',
										borderRadius: 'var(--radius-2)',
										padding: '4px 8px',
									}}
								>
									{msg.message}
								</Text>
							</Box>
						))}
					</ScrollArea>
					<Flex p='3' style={{ borderTop: '1px solid var(--gray-5)' }}>
						<TextArea
							style={{ flex: 1, marginRight: '8px' }}
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
						<Button onClick={handleSend}>Send</Button>
					</Flex>
				</Box>
			)}
		</DraggableResizable>
	)
}

export default PrivateChat
