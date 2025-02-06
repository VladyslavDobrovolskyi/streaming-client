import React from 'react'
import { Avatar, Flex } from '@radix-ui/themes'

const IconPage: React.FC = () => {
	return (
		<div>
			<h1>Icon Page</h1>
			<Flex gap='2'>
				<Avatar
					src='https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f9d0/u1f9d0_u1f633.png'
					fallback='A'
				/>
				<Avatar fallback='Allure' />
			</Flex>
		</div>
	)
}

export default IconPage
