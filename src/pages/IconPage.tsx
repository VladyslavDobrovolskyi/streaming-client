import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar'

const IconPage: React.FC = () => {
	return (
		<div>
			<h1>Icon Page</h1>
			<Avatar>
				<AvatarImage src='https://via.placeholder.com/150' alt='Avatar' />
				<AvatarFallback>AB</AvatarFallback>
			</Avatar>
		</div>
	)
}

export default IconPage
