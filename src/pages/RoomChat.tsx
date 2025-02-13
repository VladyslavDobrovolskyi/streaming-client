'use client'

import { useRef, useEffect } from 'react'
import { Box, Flex, ScrollArea, Text, TextArea, Button, Avatar } from '@radix-ui/themes'
import { Kbd } from '@radix-ui/themes'
import DraggableResizable from './DraggableResizable'

interface RoomChatProps {
    clientID: string
    messages: { username: string; message: string; avatar: string }[]
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

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
    }, [messages])

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
                        <Text size='2' weight='bold'>Chat</Text>
                        <Button variant='ghost' onClick={onClose}>
                            X
                        </Button>
                    </Flex>

					<ScrollArea style={{ flex: 1, padding: '16px' }} ref={scrollAreaRef} className='scroll-area'>
						{messages.map((msg, index) => {
							const isFirstMessageFromUser = index === 0 || messages[index - 1].username !== msg.username;
							const isCurrentUser = msg.username === clientID;
							return (
								<Flex
									key={index}
									// justify={isCurrentUser ? 'end' : 'start'}
									align='center'
									mb='2'
									style={{ textAlign: isCurrentUser ? 'right' : 'left' }}
								>
									{!isCurrentUser && isFirstMessageFromUser && (
										<Box mr='2'>
											<Avatar fallback={msg.avatar} size='2' />
										</Box>
									)}
									{!isCurrentUser && !isFirstMessageFromUser && (
										<Box mr='2' style={{ width: '32px' }} />
									)}
									<Box
										style={{
											maxWidth: '70%',
											wordWrap: 'break-word',
											backgroundColor: isCurrentUser ? 'var(--blue-5)' : 'var(--gray-3)',
											color: isCurrentUser ? 'white' : 'var(--gray-12)',
											borderRadius: 'var(--radius-2)',
											padding: '8px 12px',
											textAlign: isCurrentUser ? 'right' : 'left',
										}}
									>
										<Text size='2'>{msg.message}</Text>
									</Box>
								</Flex>
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