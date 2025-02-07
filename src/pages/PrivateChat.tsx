'use client'

import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Box, Flex, ScrollArea, Text, TextArea, Button, Avatar } from '@radix-ui/themes'
import { Resizable, ResizeCallbackData } from 'react-resizable'
import 'react-resizable/css/styles.css'

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
	const [size, setSize] = useState({ width: 300, height: 400 })
	const [position, setPosition] = useState({ top: window.innerHeight - 470, left: window.innerWidth - 620 })

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

	const onResize = (event: React.SyntheticEvent, { size, handle }: ResizeCallbackData) => {
		const { width, height } = size
		setSize({ width, height })

		// Обновляем позицию в зависимости от направления растягивания
		if (handle.includes('n')) {
			setPosition(prev => ({ ...prev, top: prev.top - (height - size.height) }))
		}
		if (handle.includes('w')) {
			setPosition(prev => ({ ...prev, left: prev.left - (width - size.width) }))
		}
	}

	return (
		<Resizable
			width={size.width}
			height={size.height}
			onResize={onResize}
			minConstraints={[200, 300]}
			maxConstraints={[500, 600]}
			resizeHandles={['se', 'sw', 'ne', 'nw']}
			style={{
				position: 'absolute',
				top: position.top,
				left: position.left,
				zIndex: 40,
			}}
		>
			<Box
				style={{
					width: size.width,
					height: size.height,
					backgroundColor: 'var(--gray-1)',
					borderRadius: 'var(--radius-3)',
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
					boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
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
		</Resizable>
	)
}

export default PrivateChat
