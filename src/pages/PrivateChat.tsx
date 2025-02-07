'use client'

import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Box, Flex, ScrollArea, Text, TextArea, Button, Avatar } from '@radix-ui/themes'

interface PrivateChatProps {
	recipientId: string
	recipientName: string
	recipientAvatar: string
	onClose: () => void
	sendPrivateMessage: (to: string, message: string) => void
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

	console.log('PrivateChat rendered', { recipientId, recipientName, privateMessagesCount: privateMessages.length })

	const handleSend = () => {
		if (message.trim()) {
			console.log('Sending message', { to: recipientId, message })
			sendPrivateMessage(recipientId, message)
			setMessage('')
		} else {
			console.log('Attempted to send empty message')
		}
	}

	useEffect(() => {
		console.log('useEffect triggered for scroll')
		if (scrollAreaRef.current) {
			const scrollArea = scrollAreaRef.current
			console.log('Scroll heights', {
				scrollTop: scrollArea.scrollTop,
				scrollHeight: scrollArea.scrollHeight,
				clientHeight: scrollArea.clientHeight,
			})
			scrollArea.scrollTop = scrollArea.scrollHeight
		} else {
			console.log('scrollAreaRef is null')
		}
	}, [scrollAreaRef]) // Changed dependency to scrollAreaRef

	useEffect(() => {
		console.log('Component mounted or updated')
		return () => {
			console.log('Component will unmount')
		}
	}, [])

	return (
		<Box
			style={{
				position: 'absolute',
				bottom: 70,
				right: 320,
				width: 300,
				height: 400,
				backgroundColor: 'var(--gray-1)',
				borderRadius: 'var(--radius-3)',
				overflow: 'hidden',
				display: 'flex',
				flexDirection: 'column',
				zIndex: 40,
			}}
		>
			<Flex align='center' justify='between' p='3' style={{ borderBottom: '1px solid var(--gray-5)' }}>
				<Flex align='center' gap='2'>
					<Avatar src={recipientAvatar} fallback={recipientName[0]} size='2' />
					<Text size='2' weight='bold'>
						{recipientName}
					</Text>
				</Flex>
				<Button
					variant='ghost'
					onClick={() => {
						console.log('Close button clicked')
						onClose()
					}}
				>
					X
				</Button>
			</Flex>
			<ScrollArea style={{ flex: 1, padding: '16px' }} ref={scrollAreaRef}>
				{privateMessages.map((msg, index) => {
					console.log('Rendering message', { index, from: msg.from, to: msg.to })
					return (
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
					)
				})}
			</ScrollArea>
			<Flex p='3' style={{ borderTop: '1px solid var(--gray-5)' }}>
				<TextArea
					style={{ flex: 1, marginRight: '8px' }}
					placeholder='Type a message...'
					value={message}
					onChange={e => {
						console.log('Message changed', { newValue: e.target.value })
						setMessage(e.target.value)
					}}
					onKeyPress={e => {
						if (e.key === 'Enter' && !e.shiftKey) {
							console.log('Enter key pressed')
							handleSend()
						}
					}}
				/>
				<Button onClick={handleSend}>Send</Button>
			</Flex>
		</Box>
	)
}

export default PrivateChat
