'use client'

import * as Toast from '@radix-ui/react-toast'
import { Avatar } from '@radix-ui/themes'
import { useEffect, useState } from 'react'
import type { ToastNotification } from '../../types/room-types'
import { StyledToastRoot, StyledToastTitle, StyledToastDescription, StyledToastViewport } from './StyledToast'

interface ToastNotificationsProps {
	toasts: ToastNotification[]
}

export default function ToastNotifications({ toasts }: ToastNotificationsProps) {
	// Track which toasts are disappearing
	const [disappearingToasts, setDisappearingToasts] = useState<Record<string, boolean>>({})

	// Set up the disappearing animation timing for each toast
	useEffect(() => {
		toasts.forEach(toast => {
			// After 2 seconds, mark the toast as disappearing
			const disappearTimer = setTimeout(() => {
				setDisappearingToasts(prev => ({
					...prev,
					[toast.id]: true,
				}))
			}, 2000)

			return () => {
				clearTimeout(disappearTimer)
			}
		})
	}, [toasts])

	return (
		<Toast.Provider swipeDirection='right'>
			{toasts.map(toast => (
				<StyledToastRoot
					key={toast.id}
					duration={3000}
					className={disappearingToasts[toast.id] ? 'disappearing' : ''}
				>
					<StyledToastTitle>
						{toast.avatar && <Avatar src={toast.avatar} fallback='?' style={{ borderRadius: '0%' }} />}
						{toast.title}
					</StyledToastTitle>
					<StyledToastDescription>{toast.description}</StyledToastDescription>
				</StyledToastRoot>
			))}
			<StyledToastViewport />
		</Toast.Provider>
	)
}
