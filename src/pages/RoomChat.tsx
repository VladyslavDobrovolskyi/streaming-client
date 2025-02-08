'use client'

import type React from 'react'
import { useRef, useEffect, useState } from 'react'
import { Box, Flex, ScrollArea, Text, TextArea, Button } from '@radix-ui/themes'
import { Kbd } from '@radix-ui/themes'
import DraggableResizable from './DraggableResizable'

interface RoomChatProps {
	clientID: string
	messages: { username: string; message: string }[]
	chatInput: string
	setChatInput: (input: string) => void
	handleSendMessage: () => void
	onClose: () => void
}

const RoomChat: React.FC<RoomChatProps> = ({
	clientID,
	messages,
	chatInput,
	setChatInput,
	handleSendMessage,
	onClose,
}) => {
	const scrollAreaRef = useRef<HTMLDivElement>(null)
	const [scale, setScale] = useState(1)

	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
		}
	}, [scrollAreaRef]) // Updated dependency

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
			bounds='.react-player'
		>
			{({ isDragging }: { isDragging: boolean }) => (
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
						<Flex align='center' gap='2'></Flex>
						<Button variant='ghost' onClick={onClose}>
							X
						</Button>
					</Flex>
					<ScrollArea style={{ flex: 1, padding: '16px' }} ref={scrollAreaRef}>
						{messages.map((msg, index) => (
							<Box key={index} mb='2' style={{ textAlign: msg.username === clientID ? 'left' : 'right' }}>
								<Text
									as='span'
									size='2'
									style={{
										display: 'inline-block',
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
