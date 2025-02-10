'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import useStateWithCallback from './useStateWithCallback'
import socket from '../socket'
import ACTIONS from '../socket/actions'

export const LOCAL_VIDEO = 'LOCAL_VIDEO'

function createMockAudioStream(): MediaStreamTrack {
	const audioContext = new AudioContext()
	const silenceBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 1, audioContext.sampleRate)
	const source = audioContext.createBufferSource()
	source.buffer = silenceBuffer
	const destination = audioContext.createMediaStreamDestination()
	source.connect(destination)
	source.start()
	return destination.stream.getAudioTracks()[0]
}

function createMockVideoStream(): MediaStreamTrack {
	const canvas = document.createElement('canvas')
	canvas.width = 1280
	canvas.height = 720
	const ctx = canvas.getContext('2d')!
	const draw = () => {
		ctx.fillStyle = 'black'
		ctx.fillRect(0, 0, canvas.width, canvas.height)
		requestAnimationFrame(draw)
	}
	draw()
	return canvas.captureStream(30).getVideoTracks()[0]
}

// function createMockMediaStream(): MediaStream {
// 	const stream = new MediaStream()

// 	// Мок аудио (тишина)
// 	const audioContext = new AudioContext()
// 	const silenceBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 1, audioContext.sampleRate)
// 	const source = audioContext.createBufferSource()
// 	source.buffer = silenceBuffer
// 	const destination = audioContext.createMediaStreamDestination()
// 	source.connect(destination)
// 	source.start()
// 	const audioTrack = destination.stream.getAudioTracks()[0]

// 	// Мок видео
// 	const canvas = document.createElement('canvas')
// 	canvas.width = 1280
// 	canvas.height = 720
// 	const ctx = canvas.getContext('2d')!
// 	const draw = () => {
// 		ctx.fillStyle = 'black'
// 		ctx.fillRect(0, 0, canvas.width, canvas.height)
// 		requestAnimationFrame(draw)
// 	}
// 	draw()
// 	const videoTrack = canvas.captureStream(30).getVideoTracks()[0]

// 	stream.addTrack(audioTrack)
// 	stream.addTrack(videoTrack)

// 	return stream
// }

export default function useWebRTC(roomID: string) {
	const [clients, updateClients] = useStateWithCallback<string[]>([])
	const [chatMessages, setChatMessages] = useState<{ username: string; message: string }[]>([])
	const [privateMessages, setPrivateMessages] = useState<
		Record<string, Array<{ from: string; to: string; message: string }>>
	>({})

	const addNewClient = useCallback(
		(newClient: string, cb: () => void) => {
			console.log(`Attempting to add new client: ${newClient}`)
			updateClients(list => {
				if (!list.includes(newClient)) {
					console.log(`New client ${newClient} added`)
					return [...list, newClient]
				}
				console.log(`Client ${newClient} already exists`)
				return list
			}, cb)
		},
		[updateClients]
	)

	const peerConnections = useRef<Record<string, RTCPeerConnection>>({})
	const localMediaStream = useRef<MediaStream | null>(null)
	const peerMediaElements = useRef<Record<string, HTMLVideoElement | null>>({
		[LOCAL_VIDEO]: null,
	})

	const iceRetryTimeout = 10000 // 2 seconds timeout

	const configuration = {
		iceServers: [
			{
				iceTransportPolicy: 'all',
				iceCandidatePoolSize: 10,
				bundlePolicy: 'max-bundle',
				rtcpMuxPolicy: 'require',
				urls: [
					'turn:92.112.180.234:3478', // URL for TURN server (UDP)
					'turns:92.112.180.234:3478', // URL for TURN server (TLS)
				],
				username: roomID, // Use roomID as the username
				credential: '9S2T4U0N5', // Specify the password
			},
		],
	}

	const createPeerConnection = (peerID: string) => {
		console.log(`Creating peer connection for ${peerID}`)
		const connection = new RTCPeerConnection(configuration)

		connection.onicecandidate = event => {
			if (event.candidate) {
				console.log(`ICE candidate for ${peerID}:`, event.candidate)
				socket.emit(ACTIONS.RELAY_ICE, {
					peerID,
					iceCandidate: event.candidate,
				})
			}
		}

		connection.oniceconnectionstatechange = () => {
			console.log(`ICE connection state changed for ${peerID}:`, connection.iceConnectionState)
			if (connection.iceConnectionState === 'connected' || connection.iceConnectionState === 'completed') {
				console.log(`ICE connection established for ${peerID}`)
				clearTimeout(iceRetryTimeout)
			}
		}

		connection.ontrack = ({ streams: [remoteStream] }) => {
			console.log(`Received track from ${peerID}`)
			addNewClient(peerID, () => {
				const element = peerMediaElements.current[peerID]
				if (element) {
					console.log(`Setting srcObject for ${peerID}`)
					element.srcObject = remoteStream
				} else {
					console.log(`Element for ${peerID} not found, setting up interval`)
					const interval = setInterval(() => {
						const settledElement = peerMediaElements.current[peerID]
						if (settledElement) {
							console.log(`Element for ${peerID} found, setting srcObject`)
							settledElement.srcObject = remoteStream
							clearInterval(interval)
						}
					}, 500)
				}
			})
		}

		localMediaStream.current?.getTracks().forEach(track => {
			console.log(`Adding local track to peer connection ${peerID}:`, track.kind)
			connection.addTrack(track, localMediaStream.current!)
		})

		return connection
	}

	const reinitializeStream = async () => {
		console.log('Reinitializing stream')
		let isMockedVideo = false
		let isMockedAudio = false

		try {
			localMediaStream.current = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: true,
			})
			console.log('Successfully obtained local media stream:', localMediaStream.current?.getTracks())
		} catch (error) {
			console.error('Error getting media: ', error)
			localMediaStream.current = new MediaStream()

			try {
				const audioTrack = await navigator.mediaDevices
					.getUserMedia({ audio: true })
					.then(stream => stream.getAudioTracks()[0])
				localMediaStream.current.addTrack(audioTrack)
			} catch (audioError) {
				console.error('Error getting audio: ', audioError)
				localMediaStream.current.addTrack(createMockAudioStream())
				isMockedAudio = true
			}

			try {
				const videoTrack = await navigator.mediaDevices
					.getUserMedia({ video: true })
					.then(stream => stream.getVideoTracks()[0])
				localMediaStream.current.addTrack(videoTrack)
			} catch (videoError) {
				console.error('Error getting video: ', videoError)
				localMediaStream.current.addTrack(createMockVideoStream())
				isMockedVideo = true
			}
		} finally {
			console.log('Joining room:', roomID)
			socket.emit(ACTIONS.JOIN, { room: roomID })
			if (isMockedVideo) {
				socket.emit(ACTIONS.SYNC_CAMERA, { roomID, socketId: socket.id, isCameraDisabled: true })
			}
			if (isMockedAudio) {
				socket.emit(ACTIONS.SYNC_MICROPHONE, { roomID, socketId: socket.id, isMicrophoneDisabled: true })
			}
			addNewClient(LOCAL_VIDEO, () => {
				const localVideoElement = peerMediaElements.current[LOCAL_VIDEO]
				if (localVideoElement) {
					console.log('Setting local video element')
					localVideoElement.volume = 0
					localVideoElement.srcObject = localMediaStream.current
				} else {
					console.warn('Local video element not found')
				}
			})
		}
	}

	// Handle new peer connection
	socket.on(ACTIONS.ADD_PEER, async ({ peerID, createOffer }: { peerID: string; createOffer: boolean }) => {
		console.log(`Received ADD_PEER for ${peerID}, createOffer: ${createOffer}`)
		if (peerID in peerConnections.current) {
			console.log(`Peer ${peerID} already exists, ignoring`)
			return null
		}

		const connection = createPeerConnection(peerID)
		peerConnections.current[peerID] = connection

		// Set ICE connection timeout and retry mechanism
		const iceConnectionTimer = setTimeout(() => {
			console.log('Current state is:', connection.iceConnectionState)
			if (connection.iceConnectionState !== 'connected' && connection.iceConnectionState !== 'completed') {
				console.warn(`Retrying connection to peer ${peerID} with new ICE servers`)
				connection.close()
				delete peerConnections.current[peerID]
				peerConnections.current[peerID] = createPeerConnection(peerID)
			}
		}, iceRetryTimeout)

		connection.oniceconnectionstatechange = () => {
			if (connection.iceConnectionState === 'connected' || connection.iceConnectionState === 'completed') {
				clearTimeout(iceConnectionTimer)
			}
		}

		if (createOffer) {
			console.log(`Creating offer for ${peerID}`)
			const offer = await connection.createOffer()
			await connection.setLocalDescription(offer)
			console.log(`Sending offer to ${peerID}`)
			socket.emit(ACTIONS.RELAY_SDP, {
				peerID,
				sessionDescription: offer,
			})
		}
	})

	// Handle remote session description
	useEffect(() => {
		async function setRemoteMedia({
			peerID,
			sessionDescription: remoteDescription,
		}: {
			peerID: string
			sessionDescription: RTCSessionDescriptionInit
		}) {
			console.log(`Setting remote description for ${peerID}`, remoteDescription)
			await peerConnections.current[peerID]?.setRemoteDescription(new RTCSessionDescription(remoteDescription))

			if (remoteDescription.type === 'offer') {
				console.log(`Creating answer for ${peerID}`)
				const answer = await peerConnections.current[peerID].createAnswer()
				await peerConnections.current[peerID].setLocalDescription(answer)
				console.log(`Sending answer to ${peerID}`)
				socket.emit(ACTIONS.RELAY_SDP, {
					peerID,
					sessionDescription: answer,
				})
			}
		}

		socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia)
		return () => {
			socket.off(ACTIONS.SESSION_DESCRIPTION)
		}
	}, [])

	// Handle ICE candidates
	useEffect(() => {
		socket.on(
			ACTIONS.ICE_CANDIDATE,
			({ peerID, iceCandidate }: { peerID: string; iceCandidate: RTCIceCandidateInit }) => {
				console.log(`Received ICE candidate for ${peerID}:`, iceCandidate)
				peerConnections.current[peerID]?.addIceCandidate(new RTCIceCandidate(iceCandidate))
			}
		)

		return () => {
			socket.off(ACTIONS.ICE_CANDIDATE)
		}
	}, [])

	// Handle peer removal
	useEffect(() => {
		const handleRemovePeer = ({ peerID }: { peerID: string }) => {
			console.log(`Removing peer ${peerID}`)
			if (peerConnections.current[peerID]) {
				peerConnections.current[peerID].close()
				delete peerConnections.current[peerID]
				delete peerMediaElements.current[peerID]
				updateClients(list => {
					console.log(`Updating client list after removing ${peerID}`)
					return list.filter(c => c !== peerID)
				})
				console.log(`Peer ${peerID} removed`)
			} else {
				console.warn(`Peer ${peerID} not found in peerConnections`)
			}
		}

		socket.on(ACTIONS.REMOVE_PEER, handleRemovePeer)
		return () => {
			console.log('Removing REMOVE_PEER event listener')
			socket.off(ACTIONS.REMOVE_PEER)
		}
	}, [updateClients])

	// Initialize local media stream and join room
	useEffect(() => {
		async function startCapture() {
			console.log('Starting media capture')
			let isMockedVideo = false
			let isMockedAudio = false

			try {
				localMediaStream.current = await navigator.mediaDevices.getUserMedia({
					audio: true,
					video: true,
				})
				console.log('Successfully obtained local media stream:', localMediaStream.current?.getTracks())
			} catch (error) {
				console.error('Error getting media: ', error)
				localMediaStream.current = new MediaStream()

				try {
					const audioTrack = await navigator.mediaDevices
						.getUserMedia({ audio: true })
						.then(stream => stream.getAudioTracks()[0])
					localMediaStream.current.addTrack(audioTrack)
				} catch (audioError) {
					console.error('Error getting audio: ', audioError)
					localMediaStream.current.addTrack(createMockAudioStream())
					isMockedAudio = true
				}

				try {
					const videoTrack = await navigator.mediaDevices
						.getUserMedia({ video: true })
						.then(stream => stream.getVideoTracks()[0])
					localMediaStream.current.addTrack(videoTrack)
				} catch (videoError) {
					console.error('Error getting video: ', videoError)
					localMediaStream.current.addTrack(createMockVideoStream())
					isMockedVideo = true
				}
			} finally {
				console.log('Joining room:', roomID)
				socket.emit(ACTIONS.JOIN, { room: roomID })
				if (isMockedVideo) {
					socket.emit(ACTIONS.SYNC_CAMERA, { roomID, socketId: socket.id, isCameraDisabled: true })
				}
				if (isMockedAudio) {
					socket.emit(ACTIONS.SYNC_MICROPHONE, { roomID, socketId: socket.id, isMicrophoneDisabled: true })
				}
				addNewClient(LOCAL_VIDEO, () => {
					const localVideoElement = peerMediaElements.current[LOCAL_VIDEO]
					if (localVideoElement) {
						console.log('Setting local video element')
						localVideoElement.volume = 0
						localVideoElement.srcObject = localMediaStream.current
					} else {
						console.warn('Local video element not found')
					}
				})
			}
		}

		startCapture()

		return () => {
			console.log('Cleaning up media stream')
			localMediaStream.current?.getTracks().forEach(track => {
				console.log(`Stopping track: ${track.kind}`)
				track.stop()
			})
			console.log('Leaving room:', roomID)
			socket.emit(ACTIONS.LEAVE)
		}
	}, [roomID, addNewClient])

	const provideMediaRef = useCallback(async (id: string, node: HTMLVideoElement | null) => {
		console.log(`Providing media ref for ${id}`)
		peerMediaElements.current[id] = node
		if (node) {
			console.log(`Media element for ${id} set`)
		} else {
			console.log(`Media element for ${id} cleared`)
		}
	}, [])

	// New function to send chat messages
	const sendChatMessage = useCallback(
		({ username, message }: { username: string; message: string }): void => {
			console.log(
				`[User: ${username} | SocketId: ${socket.id} ] Sending chat message to room ${roomID}:`,
				message
			)
			socket.emit(ACTIONS.SEND_CHAT_MESSAGE, { roomID, username, message })
		},
		[roomID]
	)

	// New effect to handle incoming chat messages
	useEffect(() => {
		socket.on(ACTIONS.RECEIVE_CHAT_MESSAGE, ({ sender, username, message, timestamp }) => {
			console.log(` ${timestamp} - Received chat message from [${sender} | ${username}]:`, message)
			setChatMessages(prevMessages => [...prevMessages, { username, message }])
		})

		return () => {
			console.log('Removing RECEIVE_CHAT_MESSAGE event listener')
			socket.off(ACTIONS.RECEIVE_CHAT_MESSAGE)
		}
	}, [])

	// New function to send private messages
	const sendPrivateMessage = useCallback(
		({ to, message }: { to: string; message: string }) => {
			console.log(`Sending private message to ${to}:`, message)
			socket.emit(ACTIONS.SEND_PRIVATE_MESSAGE, { roomID, to, message })

			// Update local state
			setPrivateMessages(prevMessages => ({
				...prevMessages,
				[to]: [...(prevMessages[to] || []), { from: LOCAL_VIDEO, to, message }],
			}))
		},
		[roomID]
	)

	// New effect to handle incoming private messages
	useEffect(() => {
		socket.on(ACTIONS.RECEIVE_PRIVATE_MESSAGE, ({ from, message }) => {
			console.log(`Received private message from ${from}:`, message)
			setPrivateMessages(prevMessages => ({
				...prevMessages,
				[from]: [...(prevMessages[from] || []), { from, to: LOCAL_VIDEO, message }],
			}))
		})

		return () => {
			console.log('Removing RECEIVE_PRIVATE_MESSAGE event listener')
			socket.off(ACTIONS.RECEIVE_PRIVATE_MESSAGE)
		}
	}, [])

	return {
		clients,
		provideMediaRef,
		localStream: localMediaStream.current,
		reinitializeStream,
		chatMessages,
		sendChatMessage,
		privateMessages,
		sendPrivateMessage,
	}
}
