import { useEffect, useRef, useCallback } from 'react'
import useStateWithCallback from './useStateWithCallback'
import socket from '../socket'
import ACTIONS from '../socket/actions'

export const LOCAL_VIDEO = 'LOCAL_VIDEO'

export default function useWebRTC(roomID: string) {
	const [clients, updateClients] = useStateWithCallback<string[]>([])

	const addNewClient = useCallback(
		(newClient: string, cb: () => void) => {
			updateClients(list => {
				if (!list.includes(newClient)) {
					return [...list, newClient]
				}
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

	const iceRetryTimeout = 5000 // 2 seconds timeout

	const createPeerConnection = (peerID: string) => {
		const connection = new RTCPeerConnection({
			iceServers: [{ urls: 'stun:stun2.1.google.com:19302' }],
		})

		connection.onicecandidate = event => {
			if (event.candidate) {
				socket.emit(ACTIONS.RELAY_ICE, {
					peerID,
					iceCandidate: event.candidate,
				})
			}
		}

		connection.ontrack = ({ streams: [remoteStream] }) => {
			addNewClient(peerID, () => {
				const element = peerMediaElements.current[peerID]
				if (element) {
					element.srcObject = remoteStream
				} else {
					const interval = setInterval(() => {
						const settledElement = peerMediaElements.current[peerID]
						if (settledElement) {
							settledElement.srcObject = remoteStream
							clearInterval(interval)
						}
					}, 500)
				}
			})
		}

		localMediaStream.current?.getTracks().forEach(track => {
			connection.addTrack(track, localMediaStream.current!)
		})

		return connection
	}

	// Handle new peer connection
	socket.on(ACTIONS.ADD_PEER, async ({ peerID, createOffer }: { peerID: string; createOffer: boolean }) => {
		if (peerID in peerConnections.current) {
			return console.warn(`Already connected to peer ${peerID}`)
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
			const offer = await connection.createOffer()
			await connection.setLocalDescription(offer)
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
			await peerConnections.current[peerID]?.setRemoteDescription(new RTCSessionDescription(remoteDescription))

			if (remoteDescription.type === 'offer') {
				const answer = await peerConnections.current[peerID].createAnswer()
				await peerConnections.current[peerID].setLocalDescription(answer)
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
			if (peerConnections.current[peerID]) {
				peerConnections.current[peerID].close()
				delete peerConnections.current[peerID]
				delete peerMediaElements.current[peerID]
				updateClients(list => list.filter(c => c !== peerID))
			}
		}

		socket.on(ACTIONS.REMOVE_PEER, handleRemovePeer)
		return () => {
			socket.off(ACTIONS.REMOVE_PEER)
		}
	}, [updateClients])

	// Initialize local media stream and join room
	useEffect(() => {
		async function startCapture() {
			try {
				localMediaStream.current = await navigator.mediaDevices.getUserMedia({
					audio: true,
					video: {
						width: 1280,
						height: 720,
					},
				})

				addNewClient(LOCAL_VIDEO, () => {
					const localVideoElement = peerMediaElements.current[LOCAL_VIDEO]
					if (localVideoElement) {
						localVideoElement.volume = 0
						localVideoElement.srcObject = localMediaStream.current
					}
				})

				socket.emit(ACTIONS.JOIN, { room: roomID })
			} catch (error) {
				console.error('Error capturing media:', error)
			}
		}

		startCapture()

		return () => {
			localMediaStream.current?.getTracks().forEach(track => track.stop())
			socket.emit(ACTIONS.LEAVE)
		}
	}, [roomID, addNewClient])

	const provideMediaRef = useCallback((id: string, node: HTMLVideoElement | null) => {
		peerMediaElements.current[id] = node
	}, [])

	return {
		clients,
		provideMediaRef,
	}
}
