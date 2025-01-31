import { useCallback, useState } from 'react'

export const useLocalStorage = <T = unknown>(
	key: string,
	initialValue?: T
): [T, (value: T | ((val: T) => T)) => void] => {
	const [storedItem, setStoredItem] = useState<T>(() => {
		const item = localStorage.getItem(key)
		return item ? JSON.parse(item) : initialValue || null
	})

	const setLocalStorage = useCallback(
		(value: T | ((val: T) => T)) => {
			const newItem = value instanceof Function ? value(storedItem) : value

			setStoredItem(newItem)
			localStorage.setItem(key, JSON.stringify(newItem))
		},
		[key, storedItem]
	)

	return [storedItem, setLocalStorage]
}
