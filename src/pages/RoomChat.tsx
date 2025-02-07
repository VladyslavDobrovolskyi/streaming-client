'use client'

import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Box, Flex, ScrollArea, Text, TextArea, Button } from '@radix-ui/themes'
import { Resizable, type ResizeCallbackData } from 'react-resizable'
import Draggable from 'react-draggable'
import { Kbd } from '@radix-ui/themes'
import 'react-resizable/css/styles.css'

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
	const [size, setSize] = useState({ width: 300, height: 400 })
	const [position, setPosition] = useState({ x: window.innerWidth - 620, y: window.innerHeight - 470 })
	const [isDragging, setIsDragging] = useState(false)
	const [scale, setScale] = useState(1)

	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
		}
	}, [scrollAreaRef]) //Corrected dependency

	const onResize = (_: React.SyntheticEvent, { size: newSize, handle }: ResizeCallbackData) => {
		const deltaWidth = newSize.width - size.width
		const deltaHeight = newSize.height - size.height

		setSize(newSize)

		setPosition(prev => {
			let newX = prev.x
			let newY = prev.y

			if (handle.includes('w')) {
				newX -= deltaWidth
			}
			if (handle.includes('n')) {
				newY -= deltaHeight
			}

			return { x: newX, y: newY }
		})
	}

	const onDrag = (_, data: { x: number; y: number }) => {
		setPosition({ x: data.x, y: data.y })
	}

	const onStart = () => {
		setIsDragging(true)
	}

	const onStop = () => {
		setIsDragging(false)
	}

	const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
		e.preventDefault()
		const scaleFactor = 0.1
		const newScale = e.deltaY > 0 ? scale * (1 - scaleFactor) : scale * (1 + scaleFactor)

		// Limit the scale to a reasonable range (e.g., 0.5 to 2)
		const clampedScale = Math.min(Math.max(newScale, 0.5), 2)

		setScale(clampedScale)

		const scaleDiff = clampedScale / scale
		setSize(prevSize => ({
			width: prevSize.width * scaleDiff,
			height: prevSize.height * scaleDiff,
		}))

		// Adjust position to keep the center point fixed
		setPosition(prevPos => ({
			x: prevPos.x - (size.width * (scaleDiff - 1)) / 2,
			y: prevPos.y - (size.height * (scaleDiff - 1)) / 2,
		}))
	}

	return (
		<Draggable
			handle='.drag-handle'
			bounds='.react-player'
			position={position}
			onDrag={onDrag}
			onStart={onStart}
			onStop={onStop}
		>
			<Resizable
				width={size.width}
				height={size.height}
				onResize={onResize}
				minConstraints={[200, 300]}
				maxConstraints={[500, 600]}
				resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
			>
				<Box
					onWheel={handleWheel}
					style={{
						width: size.width,
						height: size.height,
						backgroundColor: 'var(--gray-1)',
						borderRadius: 'var(--radius-3)',
						overflow: 'hidden',
						display: 'flex',
						flexDirection: 'column',
						boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
						position: 'absolute',
						zIndex: 40,
						transform: `scale(${scale})`,
						transformOrigin: 'center',
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
			</Resizable>
		</Draggable>
	)
}

export default RoomChat
