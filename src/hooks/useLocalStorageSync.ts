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
	cameraVisible?: boolean
	cameraOpacity?: number
	notificationStatus?: boolean
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

	const updateUserCameraVisibility = (userId: string, cameraVisible: boolean) => {
		updateUserData(userId, { cameraVisible })
	}
	const updateUserCameraOpacity = (userId: string, cameraOpacity: number) => {
		updateUserData(userId, { cameraOpacity })
	}

	const updateNotificationStatus = (userId: string, notificationStatus: boolean) => {
		updateUserData(userId, { notificationStatus })
	}

	return {
		userData,
		updateUserPosition,
		updateUserStatus,
		updateUserVolume,
		updateUserCameraVisibility,
		updateUserCameraOpacity,
		updateNotificationStatus,
	}
}

export default useLocalStorageSync
