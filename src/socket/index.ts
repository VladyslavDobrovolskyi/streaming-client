import io from 'socket.io-client'

class SocketClient {
	static instance: SocketIOClient.Socket | null = null

	static options = {
		'force new connection': true,
		reconnectionAttempts: Infinity,
		timeout: 10000,
		transports: ['websocket'],
		path: '/socket.io',
	}

	static getInstance() {
		if (!this.instance) {
			this.instance = io(this.options)
		}
		return this.instance
	}
}

export default SocketClient.getInstance()
