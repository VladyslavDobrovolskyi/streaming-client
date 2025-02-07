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

	const handleSend = () => {
		if (message.trim()) {
			sendPrivateMessage(recipientId, message)
			setMessage('')
		}
	}

	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
		}
	}, [scrollAreaRef]) //Corrected dependency

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
					onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
				/>
				<Button onClick={handleSend}>Send</Button>
			</Flex>
		</Box>
	)
}

export default PrivateChat
