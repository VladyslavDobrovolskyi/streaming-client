'use client'

import { useState, useEffect } from 'react'

interface UserPosition {
	x: number
	y: number
}

interface UserStatus {
	isCameraDisabled: boolean
	isMicrophoneDisabled: boolean
}

interface UserData {
	position: UserPosition
	status: UserStatus
	volume: number
	cameraVisible?: boolean // Added camera visibility state
}

const useLocalStorageSync = (roomId: string) => {
	const [userData, setUserData] = useState<Record<string, UserData>>({})

	useEffect(() => {
		const storedData = localStorage.getItem(`roomData_${roomId}`)
		if (storedData) {
			setUserData(JSON.parse(storedData))
		}
	}, [roomId])

	const updateUserData = (userId: string, newData: Partial<UserData>) => {
		setUserData(prevData => {
			const updatedData = {
				...prevData,
				[userId]: {
					...prevData[userId],
					...newData,
				},
			}
			localStorage.setItem(`roomData_${roomId}`, JSON.stringify(updatedData))
			return updatedData
		})
	}

	const updateUserPosition = (userId: string, position: UserPosition) => {
		updateUserData(userId, { position })
	}

	const updateUserStatus = (userId: string, status: UserStatus) => {
		updateUserData(userId, { status })
	}

	const updateUserVolume = (userId: string, volume: number) => {
		updateUserData(userId, { volume })
	}

	// Add new function to update camera visibility
	const updateUserCameraVisibility = (userId: string, cameraVisible: boolean) => {
		updateUserData(userId, { cameraVisible })
	}

	return {
		userData,
		updateUserPosition,
		updateUserStatus,
		updateUserVolume,
		updateUserCameraVisibility, // Export the new function
	}
}

export default useLocalStorageSync
