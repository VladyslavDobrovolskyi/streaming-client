import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import DOMPurify from 'dompurify'
import { validatePasswordLength } from '../utils/validation'
import { login } from '../features/auth/authSlice'
import { Link } from 'react-router-dom'
import styles from './AuthForm.module.css'

const LoginForm = () => {
	useEffect(() => {
		document.title = 'Sign In'
	}, [])

	const [formData, setFormData] = useState({
		username: '',
		password: '',
	})

	const [errors, setErrors] = useState({
		username: '',
		password: '',
	})

	const dispatch = useDispatch()

	const handleChange = e => {
		const sanitizedValue = DOMPurify.sanitize(e.target.value)
		setFormData({ ...formData, [e.target.id]: sanitizedValue })

		if (errors[e.target.id]) {
			setErrors({ ...errors, [e.target.id]: '' })
		}
	}

	const handleSubmit = async e => {
		e.preventDefault()
		setErrors({ username: '', password: '' })

		const { username, password } = formData
		let formIsValid = true

		if (!username) {
			setErrors(prevState => ({ ...prevState, username: 'Username is required.' }))
			formIsValid = false
		}

		if (!validatePasswordLength(password)) {
			setErrors(prevState => ({ ...prevState, password: 'Password must be at least 8 characters long.' }))
			formIsValid = false
		}

		if (!formIsValid) return

		try {
			const resultAction = await dispatch(login({ username, password })).unwrap()
			console.log('Login success:', resultAction)
		} catch (err) {
			setErrors({ username: err.message, password: '' })
			console.error('Login error:', err)
		}
	}

	return (
		<div className={`${styles.authForm} ${styles.loginForm}`}>
			<h2>Sign In</h2>
			<form onSubmit={handleSubmit}>
				<div className={styles.formGroup}>
					<label htmlFor='username'>Username</label>
					<input
						type='text'
						id='username'
						placeholder='Username'
						value={formData.username}
						onChange={handleChange}
						className={`${styles.inputField} ${errors.username ? styles.errorInput : ''}`}
					/>
					{errors.username && <p className={styles.errorMessage}>{errors.username}</p>}
				</div>
				<div className={styles.formGroup}>
					<label htmlFor='password'>Password</label>
					<input
						type='password'
						id='password'
						placeholder='Password'
						value={formData.password}
						onChange={handleChange}
						className={`${styles.inputField} ${errors.password ? styles.errorInput : ''}`}
					/>
					{errors.password && <p className={styles.errorMessage}>{errors.password}</p>}
				</div>
				<button type='submit' className={styles.submitButton}>
					Sign In
				</button>
			</form>
			<p className={styles.registerLink}>
				Don't have an account? <Link to='/register'>Create one</Link>
			</p>
		</div>
	)
}

export default LoginForm
