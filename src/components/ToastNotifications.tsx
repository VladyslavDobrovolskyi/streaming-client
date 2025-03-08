'use client'

import * as Toast from '@radix-ui/react-toast'
import { Avatar, Badge } from '@radix-ui/themes'
import type { ToastNotification } from '../types/room-types'
import {
	StyledToastRoot,
	StyledToastTitle,
	StyledToastDescription,
	StyledToastClose,
	StyledToastViewport,
} from './StyledToast'

interface ToastNotificationsProps {
	toasts: ToastNotification[]
}

export default function ToastNotifications({ toasts }: ToastNotificationsProps) {
	return (
		<Toast.Provider swipeDirection='right'>
			{toasts.map(toast => (
				<StyledToastRoot key={toast.id} duration={3000}>
					<StyledToastTitle>
						{toast.avatar && <Avatar src={toast.avatar} fallback='?' />}
						{toast.title}
						{toast.count > 1 && (
							<Badge variant='solid' color='blue'>
								x{toast.count}
							</Badge>
						)}
					</StyledToastTitle>
					<StyledToastDescription>{toast.description}</StyledToastDescription>
					<StyledToastClose>
						<span aria-hidden>×</span>
					</StyledToastClose>
				</StyledToastRoot>
			))}
			<StyledToastViewport />
		</Toast.Provider>
	)
}
