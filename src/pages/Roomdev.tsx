import { useState } from 'react'
import { Avatar, Button, Card, Tooltip } from '@geist-ui/core'
import { Mic, MicOff, MessageCircle } from '@geist-ui/icons'

const users = [
	{ id: 1, name: 'Alice', avatar: 'https://i.pravatar.cc/40', micOn: true },
	{ id: 2, name: 'Bob', avatar: 'https://i.pravatar.cc/41', micOn: false },
	{ id: 3, name: 'Charlie', avatar: 'https://i.pravatar.cc/42', micOn: true },
]

export default function Roomdev() {
	const [micEnabled, setMicEnabled] = useState(true)
	const [chatVisible, setChatVisible] = useState(false)

	return (
		<div className='flex h-screen w-full bg-gray-900 text-white'>
			{/* Chat Panel */}
			{chatVisible && (
				<div className='w-64 bg-gray-800 p-4 border-r border-gray-700'>
					<h2 className='text-lg font-bold mb-4'>Chat</h2>
					<p>Чат пока пуст...</p>
				</div>
			)}

			{/* Main Room */}
			<div className='flex flex-col flex-grow items-center justify-center p-4'>
				<Card className='w-full max-w-3xl bg-gray-700 p-4'>
					<h2 className='text-xl font-bold mb-2'>Фильм</h2>
					<div className='bg-black h-64 flex items-center justify-center'>Плеер</div>
				</Card>

				{/* User List */}
				<div className='flex gap-4 mt-4'>
					{users.map(user => (
						<Tooltip key={user.id} text={user.name}>
							<div className='relative'>
								<Avatar src={user.avatar} sizes='large' />
								{user.micOn ? (
									<Mic
										className='absolute bottom-0 right-0 bg-green-500 rounded-full p-1 text-white'
										size={16}
									/>
								) : (
									<MicOff
										className='absolute bottom-0 right-0 bg-red-500 rounded-full p-1 text-white'
										size={16}
									/>
								)}
							</div>
						</Tooltip>
					))}
				</div>

				{/* Controls */}
				<div className='flex gap-4 mt-6'>
					<Button
						auto
						onClick={() => setMicEnabled(!micEnabled)}
						placeholder=''
						onPointerEnterCapture={() => {}}
						onPointerLeaveCapture={() => {}}
					>
						{micEnabled ? <Mic size={20} /> : <MicOff size={20} />} Микрофон
					</Button>
					<Button
						auto
						onClick={() => setChatVisible(!chatVisible)}
						placeholder=''
						onPointerEnterCapture={() => {}}
						onPointerLeaveCapture={() => {}}
					>
						<MessageCircle size={20} /> Чат
					</Button>
				</div>
			</div>
		</div>
	)
}
