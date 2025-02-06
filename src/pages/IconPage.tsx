import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar'

const IconPage: React.FC = () => {
	return (
		<div>
			<h1>Icon Page</h1>
			<Avatar>
				<AvatarImage
					src='https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f9d0/u1f9d0_u1f633.png'
					alt='Avatar'
				/>
				<AvatarFallback>AB</AvatarFallback>
			</Avatar>
		</div>
	)
}

export default IconPage
