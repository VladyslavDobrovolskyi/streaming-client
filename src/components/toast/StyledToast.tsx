import * as Toast from '@radix-ui/react-toast'
import { styled, keyframes } from '@stitches/react'

const slideIn = keyframes({
	from: { transform: `translateX(calc(100% + 1rem))` },
	to: { transform: 'translateX(0)' },
})

export const StyledToastViewport = styled(Toast.Viewport, {
	position: 'fixed',
	bottom: 0,
	right: 0,
	display: 'flex',
	flexDirection: 'column',
	padding: '1rem',
	gap: '0.5rem',
	width: '390px',
	maxWidth: '100vw',
	margin: 0,
	listStyle: 'none',
	zIndex: 2147483647,
})

export const StyledToastRoot = styled(Toast.Root, {
	backgroundColor: 'white',
	borderRadius: '0.5rem',
	boxShadow: 'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px',
	padding: '0.75rem',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'flex-start',
	gap: '0.5rem',
	animation: `${slideIn} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
})

export const StyledToastTitle = styled(Toast.Title, {
	fontWeight: 500,
	color: 'black',
	fontSize: '1rem',
})

export const StyledToastDescription = styled(Toast.Description, {
	color: 'gray',
	fontSize: '0.875rem',
})

export const StyledToastClose = styled(Toast.Close, {
	position: 'absolute',
	top: '0.5rem',
	right: '0.5rem',
	background: 'none',
	border: 'none',
	cursor: 'pointer',
	color: 'gray',
	'&:hover': {
		color: 'black',
	},
})
