'use client'

import { useState } from 'react'
import { Card, Text, User, Grid, Button } from '@geist-ui/core'
import { Mic, MicOff } from '@geist-ui/icons'

interface RoomUser {
	id: string
	name: string
	avatar: string
}

const mockUsers: RoomUser[] = [
	{ id: '1', name: 'Alice', avatar: '/placeholder.svg?height=40&width=40' },
	{ id: '2', name: 'Bob', avatar: '/placeholder.svg?height=40&width=40' },
	{ id: '3', name: 'Charlie', avatar: '/placeholder.svg?height=40&width=40' },
]

export default function Room() {
	const [isMicMuted, setIsMicMuted] = useState(false)

	const toggleMic = () => {
		setIsMicMuted(!isMicMuted)
	}

	return (
		<div style={{ padding: '20px' }}>
			<Text h2>Live Stream Room</Text>
			<Grid.Container gap={2}>
				<Grid xs={24} md={16}>
					<Card width='100%'>
						<div style={{ position: 'relative' }}>
							<video
								src='https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
								autoPlay
								controls
								style={{ width: '100%', height: 'auto' }}
							/>
						</div>
					</Card>
				</Grid>
				<Grid xs={24} md={8}>
					<Card width='100%'>
						<Text h3>Users in Room</Text>
						{mockUsers.map(user => (
							<User key={user.id} src={user.avatar} name={user.name} />
						))}
					</Card>
				</Grid>
			</Grid.Container>
			<div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
				<Button
					icon={isMicMuted ? <Mic /> : <MicOff />}
					auto
					scale={1}
					onClick={toggleMic}
					placeholder={undefined}
					onPointerEnterCapture={undefined}
					onPointerLeaveCapture={undefined}
				>
					{isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
				</Button>
			</div>
		</div>
	)
}
