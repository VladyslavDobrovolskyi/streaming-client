import type React from 'react'
import { Box, Flex, ScrollArea, Text, TextField, Button } from '@radix-ui/themes'

interface ChatComponentProps {
	clientID: string
	messages: { username: string; message: string }[]
	chatInput: string
	setChatInput: (input: string) => void
	handleSendMessage: () => void
}

const ChatComponent: React.FC<ChatComponentProps> = ({
	clientID,
	messages,
	chatInput,
	setChatInput,
	handleSendMessage,
}) => {
	return (
		<Flex direction='column' style={{ height: '100%' }}>
			<ScrollArea style={{ flex: 1, padding: '16px' }}>
				{messages.map((msg, index) => (
					<Box key={index} mb='2' style={{ textAlign: msg.username === clientID ? 'right' : 'left' }}>
						<Text
							as='span'
							size='2'
							style={{
								display: 'inline-block',
								backgroundColor: 'var(--gray-3)',
								borderRadius: 'var(--radius-2)',
								padding: '4px 8px',
							}}
						>
							{msg.username}:{msg.message}
						</Text>
					</Box>
				))}
			</ScrollArea>
			<Flex p='3' style={{ borderTop: '1px solid var(--gray-5)' }}>
				<TextField.Root style={{ flex: 1, marginRight: '8px' }}>
					<TextField.Slot>
						<input
							placeholder='Type a message...'
							value={chatInput}
							onChange={e => setChatInput(e.target.value)}
							onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
						/>
					</TextField.Slot>
				</TextField.Root>
				<Button onClick={handleSendMessage}>Send</Button>
			</Flex>
		</Flex>
	)
}

export default ChatComponent
