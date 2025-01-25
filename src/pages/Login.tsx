import React, { useState } from 'react'

const Login: React.FC = () => {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)

	const handleLogin = async () => {
		try {
			const response = await fetch('https://streaming.vladyslavdobrovolskyi.tech/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ username, password }),
			})

			const data = await response.json()
			if (response.ok) {
				localStorage.setItem('token', data.token)
				setError(null)
				// Redirect or update UI as needed
			} else {
				setError(data.message)
			}
		} catch {
			setError('An error occurred while logging in')
		}
	}

	return (
		<div>
			<h2>Login (CI-CD-TEST)</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<input type='text' placeholder='Username' value={username} onChange={e => setUsername(e.target.value)} />
			<input
				type='password'
				placeholder='Password'
				value={password}
				onChange={e => setPassword(e.target.value)}
			/>
			<button onClick={handleLogin}>Login</button>
		</div>
	)
}

export default Login
