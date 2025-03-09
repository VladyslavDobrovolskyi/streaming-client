'use client'

import { Avatar } from '@radix-ui/themes'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { FaMicrophoneAlt, FaMicrophoneAltSlash } from 'react-icons/fa'
import { BsCameraVideoFill, BsCameraVideoOffFill } from 'react-icons/bs'
import { IoChatbubbleOutline } from 'react-icons/io5'
import { IoChatbubbleSharp } from 'react-icons/io5'
// import type { UserListProps } from '../../types/room-types'

export default function UserList({
	showUserList,
	toggleUserList,
	clients,
	participantInfo,
	localVideoId,
	isMicrophoneDisabled,
	isCameraDisabled,
	highlightedUser,
	setHighlightedUser,
	parcipantVolume,
	togglePrivateChat,
	toggleRemoteMic,
	unreadMessages,
	avatar,
	userListWidth,
	hideUsers,
}) {
	return (
		<>
			<div
				style={{
					position: 'absolute',
					top: '50%',
					right: showUserList ? userListWidth : 0,
					transform: 'translateY(-50%)',
					zIndex: 30,
					transition: 'right 0.3s ease-in-out',
				}}
			>
				<button
					onClick={toggleUserList}
					style={{
						background: 'rgba(0, 0, 0, 0.5)',
						border: 'none',
						borderRadius: '50% 0 0 50%',
						padding: '10px',
						cursor: 'pointer',
					}}
				>
					<ArrowLeftIcon style={{ color: 'white', transform: `rotate(${showUserList ? 180 : 0}deg)` }} />
				</button>
			</div>

			{showUserList && (
				<div
					style={{
						position: 'absolute',
						top: 0,
						right: 0,
						width: `${userListWidth}px`,
						height: '100%',
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						zIndex: 25,
						overflowY: 'auto',
						overflowX: 'hidden',
						transition: 'right 0.6s ease-in-out',
					}}
				>
					<h2 style={{ color: 'white', padding: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
						Users
					</h2>
					{Object.keys(participantInfo).length === 0 && (
						<div style={{ padding: '10px', color: 'white', textAlign: 'center' }}>
							<p>No other participants are currently in the room.</p>
						</div>
					)}
					{clients
						.filter(clientID => clientID !== localVideoId)
						.map(clientID => {
							const username = participantInfo[clientID]?.username || 'Anonymous'
							const displayUsername = username

							return (
								<div
									key={clientID}
									style={{
										padding: '10px',
										borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
										backgroundColor:
											highlightedUser === clientID ? 'rgba(0, 255, 255,0.4)' : 'transparent',
										display: 'flex',
										alignItems: 'center',
										gap: '10px',
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}
									onMouseEnter={() => setHighlightedUser(clientID)}
									onMouseLeave={() => setHighlightedUser(null)}
								>
									<Avatar
										src={clientID === localVideoId ? avatar : participantInfo[clientID]?.avatar}
										fallback='?'
										style={{ borderRadius: '0%' }}
									/>
									<div style={{ position: 'relative', flexGrow: 1 }}>
										<p
											style={{
												color: 'white',
												margin: 0,
												cursor: username.length > 15 ? 'pointer' : 'default',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
												maxWidth: '150px',
											}}
											title={username}
										>
											{displayUsername}
										</p>
									</div>
									<span
										onClick={() => toggleRemoteMic(clientID)}
										style={{
											color:
												clientID === localVideoId
													? isMicrophoneDisabled
														? 'rgba(247, 65, 101, 0.7)'
														: 'rgba(165, 247, 65, 0.7)'
													: participantInfo[clientID].isMicrophoneDisabled
													? 'rgba(247, 65, 101, 0.7)'
													: 'rgba(165, 247, 65, 0.7)',
											opacity: parcipantVolume[clientID] === 0 ? 0.3 : 1,
											cursor: 'pointer',
										}}
									>
										{clientID === localVideoId ? (
											isMicrophoneDisabled ? (
												<FaMicrophoneAltSlash />
											) : (
												<FaMicrophoneAlt />
											)
										) : participantInfo[clientID].isMicrophoneDisabled ? (
											<FaMicrophoneAltSlash />
										) : (
											<FaMicrophoneAlt />
										)}
									</span>
									<span
										style={{
											color:
												participantInfo[clientID].isCameraDisabled ||
												(clientID === localVideoId && isCameraDisabled)
													? 'rgba(247, 65, 101, 0.7)'
													: 'rgba(165, 247, 65, 0.7)',
											opacity: hideUsers ? 0.3 : 1,
										}}
									>
										{participantInfo[clientID].isCameraDisabled ||
										(clientID === localVideoId && isCameraDisabled) ? (
											<BsCameraVideoOffFill />
										) : (
											<BsCameraVideoFill />
										)}
									</span>
									<div style={{ display: 'flex', alignItems: 'center' }}>
										<button
											onClick={() => togglePrivateChat(clientID)}
											style={{
												background: 'none',
												border: 'none',
												cursor: 'pointer',
												color: 'white',
												padding: '5px',
												position: 'relative',
											}}
										>
											{unreadMessages[clientID] > 0 ? (
												<IoChatbubbleSharp
													style={{
														fill: 'white',
														position: 'relative',
													}}
												/>
											) : (
												<IoChatbubbleOutline
													style={{
														fill: 'none',
														position: 'relative',
													}}
												/>
											)}
											{unreadMessages[clientID] > 0 && (
												<span
													style={{
														position: 'absolute',
														top: '45%',
														left: '50%',
														transform: 'translate(-50%, -50%)',
														fontSize: '1.2rem',
														backgroundColor: 'transparent',
														color: 'black',
														borderRadius: '50%',
														fontWeight: 'bold',
													}}
												>
													{unreadMessages[clientID]}
												</span>
											)}
										</button>
									</div>
								</div>
							)
						})}
				</div>
			)}
		</>
	)
}
