'use client'

import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Box, Flex, ScrollArea, Text, TextArea, Button, Avatar } from '@radix-ui/themes'
import Draggable from 'react-draggable'

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
	const [position, setPosition] = useState({ x: 0, y: 0 })
	const [isDragging, setIsDragging] = useState(false)

	useEffect(() => {
		if (scrollAreaRef.current) {
			const scrollArea = scrollAreaRef.current
			scrollArea.scrollTop = scrollArea.scrollHeight
		}
	}, [scrollAreaRef]) //Corrected dependency

	const handleSend = () => {
		if (message.trim()) {
			sendPrivateMessage({ to: recipientId, message })
			setMessage('')
		}
	}

	const handleDragStart = () => {
		setIsDragging(true)
	}

	const handleDrag = (_, data: { x: number; y: number }) => {
		setPosition({ x: data.x, y: data.y })
	}

	const handleDragStop = () => {
		setIsDragging(false)
	}

	return (
		<Draggable
			handle='.drag-handle'
			position={position}
			onStart={handleDragStart}
			onDrag={handleDrag}
			onStop={handleDragStop}
			bounds='parent'
		>
			<Box
				style={{
					position: 'absolute',
					bottom: 70,
					right: 320,
					width: 300,
					height: 400,
					zIndex: 40,
				}}
			>
				{isDragging && (
					<Box
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: '100%',
							border: '2px dashed var(--gray-8)',
							borderRadius: 'var(--radius-3)',
							pointerEvents: 'none',
						}}
					/>
				)}
				<Box
					style={{
						width: '100%',
						height: '100%',
						backgroundColor: 'var(--gray-1)',
						borderRadius: 'var(--radius-3)',
						overflow: 'hidden',
						display: 'flex',
						flexDirection: 'column',
						boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
					}}
				>
					<Flex
						align='center'
						justify='between'
						p='3'
						style={{ borderBottom: '1px solid var(--gray-5)', cursor: 'move' }}
						className='drag-handle'
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
			</Box>
		</Draggable>
	)
}

export default PrivateChat
