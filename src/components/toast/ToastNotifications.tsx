'use client'

import * as Toast from '@radix-ui/react-toast'
import { Avatar } from '@radix-ui/themes'
// import { Badge } from '@radix-ui/themes'
import type { ToastNotification } from '../../types/room-types'
import { StyledToastRoot, StyledToastTitle, StyledToastDescription, StyledToastViewport } from './StyledToast'

interface ToastNotificationsProps {
	toasts: ToastNotification[]
}

export default function ToastNotifications({ toasts }: ToastNotificationsProps) {
	return (
		<Toast.Provider swipeDirection='right'>
			{toasts.map(toast => (
				<StyledToastRoot key={toast.id} duration={3000} style={{ animation: 'fadeOut 1s' }}>
					<StyledToastTitle>
						{toast.avatar && <Avatar src={toast.avatar} fallback='?' style={{ borderRadius: '0%' }} />}
						{toast.title}
						{/* {toast.count > 1 && (
							<Badge variant='solid' color='blue'>
								x{toast.count}
							</Badge>
						)} */}
					</StyledToastTitle>
					<StyledToastDescription>{toast.description}</StyledToastDescription>
				</StyledToastRoot>
			))}
			<StyledToastViewport />
		</Toast.Provider>
	)
}
