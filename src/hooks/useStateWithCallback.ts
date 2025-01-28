import { useState, useCallback, useRef, useEffect } from 'react'

const useStateWithCallback = <T>(
	initialState: T
): [T, (newState: T | ((prev: T) => T), cb?: (state: T) => void) => void] => {
	const [state, setState] = useState(initialState)
	const cbRef = useRef<((state: T) => void) | null>(null)

	const updateState = useCallback((newState: T | ((prev: T) => T), cb?: (state: T) => void) => {
		cbRef.current = cb || null
		setState(prev => (typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState))
	}, [])

	useEffect(() => {
		if (cbRef.current) {
			cbRef.current(state)
			cbRef.current = null
		}
	}, [state])

	return [state, updateState]
}

export default useStateWithCallback
