import type React from 'react'
import { useState, useEffect } from 'react'
import { Button } from '@radix-ui/themes'
import { TextArea } from '@radix-ui/themes'
import { ScrollArea } from '@radix-ui/themes'

interface ChatMessage {
	sender: string
	content: string
	timestamp: number
}

interface ChatComponentProps {
	socket: WebSocket
	clientID: string
}

const ChatComponent: React.FC<ChatComponentProps> = ({ socket, clientID }) => {
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [inputMessage, setInputMessage] = useState('')

	useEffect(() => {
		socket.addEventListener('message', handleIncomingMessage)
		return () => {
			socket.removeEventListener('message', handleIncomingMessage)
		}
	}, [socket])

	const handleIncomingMessage = (event: MessageEvent) => {
		const data = JSON.parse(event.data)
		if (data.type === 'chat') {
			setMessages(prevMessages => [...prevMessages, data.message])
		}
	}

	const sendMessage = () => {
		if (inputMessage.trim()) {
			const message: ChatMessage = {
				sender: clientID,
				content: inputMessage,
				timestamp: Date.now(),
			}
			socket.send(JSON.stringify({ type: 'chat', message }))
			setInputMessage('')
		}
	}

	const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			sendMessage()
		}
	}

	return (
		<div className='chat-component flex flex-col h-full'>
			<ScrollArea className='flex-grow p-4'>
				{messages.map((msg, index) => (
					<div key={index} className={`mb-4 ${msg.sender === clientID ? 'text-right' : 'text-left'}`}>
						<span
							className={`inline-block p-2 rounded-lg ${
								msg.sender === clientID ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
							}`}
						>
							<span className='font-bold'>{msg.sender}: </span>
							<span>{msg.content}</span>
						</span>
					</div>
				))}
			</ScrollArea>
			<div className='p-4 border-t border-gray-200'>
				<TextArea
					placeholder='Reply to comment…'
					value={inputMessage}
					onChange={e => setInputMessage(e.target.value)}
					onKeyPress={handleKeyPress}
					style={{ width: '100%', marginBottom: '8px' }}
				/>
				<Button onClick={sendMessage} className='w-full'>
					Send
				</Button>
			</div>
		</div>
	)
}

export default ChatComponent
