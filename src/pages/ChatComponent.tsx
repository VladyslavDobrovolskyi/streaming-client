import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@radix-ui/themes'
import { TextArea } from '@radix-ui/themes'

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
	const messagesEndRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		socket.addEventListener('message', handleIncomingMessage)
		return () => {
			socket.removeEventListener('message', handleIncomingMessage)
		}
	}, [socket])

	useEffect(() => {
		scrollToBottom()
	}, []) // Removed unnecessary dependency 'messages'

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

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				backgroundColor: 'rgba(0, 0, 0, 0.8)',
				color: 'white',
			}}
		>
			<div
				style={{
					flexGrow: 1,
					overflowY: 'auto',
					padding: '16px',
				}}
			>
				{messages.map((msg, index) => (
					<div
						key={index}
						style={{
							marginBottom: '16px',
							textAlign: msg.sender === clientID ? 'right' : 'left',
						}}
					>
						<span
							style={{
								display: 'inline-block',
								padding: '8px',
								borderRadius: '8px',
								backgroundColor: msg.sender === clientID ? '#0084ff' : '#333',
								color: 'white',
							}}
						>
							<strong>{msg.sender}: </strong>
							<span>{msg.content}</span>
						</span>
					</div>
				))}
				<div ref={messagesEndRef} />
			</div>
			<div
				style={{
					padding: '16px',
					borderTop: '1px solid rgba(255, 255, 255, 0.1)',
				}}
			>
				<TextArea
					placeholder='Написать сообщение...'
					value={inputMessage}
					onChange={e => setInputMessage(e.target.value)}
					onKeyPress={handleKeyPress}
					style={{
						width: '100%',
						marginBottom: '8px',
						backgroundColor: 'rgba(255, 255, 255, 0.1)',
						color: 'white',
						border: 'none',
						padding: '8px',
						borderRadius: '4px',
					}}
				/>
				<Button
					onClick={sendMessage}
					style={{
						width: '100%',
						backgroundColor: '#0084ff',
						color: 'white',
						border: 'none',
						padding: '8px',
						borderRadius: '4px',
						cursor: 'pointer',
					}}
				>
					Отправить
				</Button>
			</div>
		</div>
	)
}

export default ChatComponent
