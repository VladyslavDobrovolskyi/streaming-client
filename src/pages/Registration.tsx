import React, { useState } from 'react'

const Registration: React.FC = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    const validatePasswordLength = (password: string) => {
        return password.length >= 8
    }

    const handleRegistration = async () => {
        setLoading(true)
        setError(null)
        setSuccessMessage('')

        if (!username.trim()) {
            setError('Username is required!')
            setLoading(false)
            return
        }

        if (!validatePasswordLength(password)) {
            setError('Password should be at least 8 characters!')
            setLoading(false)
            return
        }


        try {
            const response = await fetch('https://streaming.vladyslavdobrovolskyi.tech/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            })

            const data = await response.json()
            if (response.ok) {
                setSuccessMessage('Registration successful! Redirecting to login...')
                setTimeout(() => {
                    // Здесь можешь добавить редирект на страницу логина
                    window.location.href = '/login'
                }, 2000)
            } else {
                setError(data.message)
            }
        } catch {
            setError('An error occurred while registering')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h2>Registration</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleRegistration} disabled={loading}>
                {loading ? 'Loading...' : 'Create account'}
            </button>
        </div>
    )
}

export default Registration
