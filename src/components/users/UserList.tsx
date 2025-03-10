'use client'

import { Avatar } from '@radix-ui/themes'
import { FaMicrophoneAlt, FaMicrophoneAltSlash } from 'react-icons/fa'
import { BsCameraVideoFill, BsCameraVideoOffFill } from 'react-icons/bs'
import { IoChatboxEllipsesOutline } from 'react-icons/io5'
import { IoChatbox } from 'react-icons/io5'
import { ImCross } from 'react-icons/im'
import { LiaUsersCogSolid } from 'react-icons/lia'
import { FaUsers } from 'react-icons/fa'
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
	participantVolume,
	participantCameras,
	togglePrivateChat,
	toggleRemoteMic,
	toggleRemoteCamera,
	unreadMessages,
	avatar,
	userListWidth,
	showUserListButton,
	privateChats,
}) {
	return (
		<>
			<div
				style={{
					display: showUserListButton ? 'block' : 'none',
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
					<LiaUsersCogSolid style={{ color: 'white' }} />
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
						transition: 'right 0.5s ease-in-out',
					}}
				>
					<h2 style={{ color: 'white', padding: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
						<FaUsers />
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
										border:
											highlightedUser == clientID
												? '3px solid rgba(255, 255, 255, 1)'
												: '3px solid transparent',
										borderRadius: '5px',
										backgroundColor:
											highlightedUser === clientID ? 'rgba(255,255,255,0.2)' : 'transparent',
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
										onClick={event => {
											console.log(
												`UserList: Toggling mic for ${clientID}, current volume: ${participantVolume[clientID]}`
											)

											// Call toggleRemoteMic with the current state
											toggleRemoteMic(clientID)

											// Add a visual feedback for the click
											const element = event.currentTarget
											element.style.transform = 'scale(0.9)'
											setTimeout(() => {
												element.style.transform = 'scale(1)'
											}, 100)
										}}
										style={{
											color:
												clientID === localVideoId
													? isMicrophoneDisabled
														? 'rgba(247, 65, 101, 0.7)'
														: 'rgba(165, 247, 65, 0.7)'
													: participantInfo[clientID]?.isMicrophoneDisabled
													? 'rgba(247, 65, 101, 0.7)'
													: 'rgba(165, 247, 65, 0.7)',
											opacity: participantVolume[clientID] === 0 ? 0.3 : 1,
											cursor: 'pointer',
											position: 'relative',
											transition: 'transform 0.1s ease',
										}}
									>
										{participantVolume[clientID] === 0 && (
											<ImCross
												style={{
													position: 'absolute',
													top: '0px',
													right: '0px',
													color: 'white',
													transform: 'scale(0.7)',
												}}
											/>
										)}
										{clientID === localVideoId ? (
											isMicrophoneDisabled ? (
												<FaMicrophoneAltSlash />
											) : (
												<FaMicrophoneAlt />
											)
										) : participantInfo[clientID]?.isMicrophoneDisabled ? (
											<>
												<FaMicrophoneAltSlash />
												{participantVolume[clientID] === 0 && (
													<ImCross
														style={{
															position: 'absolute',
															top: '0px',
															right: '0px',
															color: 'white',
															transform: 'scale(0.7)',
														}}
													/>
												)}
											</>
										) : (
											<FaMicrophoneAlt />
										)}
									</span>
									<span
										onClick={event => {
											toggleRemoteCamera(clientID)
											// Add a visual feedback for the click
											const element = event.currentTarget
											element.style.transform = 'scale(0.9)'
											setTimeout(() => {
												element.style.transform = 'scale(1)'
											}, 100)
										}}
										style={{
											cursor: 'pointer',
											color:
												participantInfo[clientID].isCameraDisabled ||
												(clientID === localVideoId && isCameraDisabled)
													? 'rgba(247, 65, 101, 0.7)'
													: 'rgba(165, 247, 65, 0.7)',
											opacity: participantCameras[clientID] === false ? 0.3 : 1,
											position: 'relative',
											transition: 'transform 0.1s ease',
										}}
									>
										{participantCameras[clientID] === false && (
											<ImCross
												style={{
													position: 'absolute',
													top: '0px',
													right: '0px',
													color: 'white',
													transform: 'scale(0.7)',
												}}
											/>
										)}
										{participantInfo[clientID].isCameraDisabled ||
										(clientID === localVideoId && isCameraDisabled) ? (
											<BsCameraVideoOffFill />
										) : (
											<BsCameraVideoFill />
										)}
									</span>
									<div style={{ display: 'flex', alignItems: 'center' }}>
										<button
											onClick={event => {
												togglePrivateChat(clientID)
												// Add a visual feedback for the click
												const element = event.currentTarget
												element.style.transform = 'scale(0.9)'
												setTimeout(() => {
													element.style.transform = 'scale(1)'
												}, 100)
											}}
											style={{
												background: 'none',
												border: 'none',
												cursor: 'pointer',
												color: 'white',
												padding: '5px',
												position: 'relative',
												opacity: privateChats[clientID] ? 1 : 0.5,
												transition: 'transform 0.1s ease',
											}}
										>
											{unreadMessages[clientID] > 0 ? (
												<IoChatbox
													style={{
														fill: 'white',
														position: 'relative',
													}}
												/>
											) : (
												<IoChatboxEllipsesOutline
													style={{
														position: 'relative',
													}}
												/>
											)}
											{unreadMessages[clientID] > 0 && (
												<span
													style={{
														position: 'absolute',
														top: '40%',
														left: '50%',
														transform: 'translate(-50%, -50%) scale(1.1)',
														fontSize: '1.2rem',
														backgroundColor: 'transparent',
														color: 'black',
														borderRadius: '50%',
														fontWeight: 'bold',
														opacity: 0.8,
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
