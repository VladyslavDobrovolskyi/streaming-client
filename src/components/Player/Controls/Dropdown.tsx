import { useState, memo, useCallback, useRef, useEffect } from 'react'
import { CSSTransition } from 'react-transition-group'
import { ArrowLeft } from '@geist-ui/icons'

interface DropdownProps {
	on: boolean
	playbackRates: number[]
	activePlaybackRate: number
	onClose: (on: boolean) => void
	onChangePlaybackRate: (playbackRate: number) => void
}

const Dropdown: React.FC<DropdownProps> = ({
	on,
	playbackRates,
	activePlaybackRate,
	onClose,
	onChangePlaybackRate,
}) => {
	const [isMounted, setIsMounted] = useState(false)
	const [isIndex, setIsIndex] = useState(true)
	const [activeType, setActiveType] = useState<'speed' | 'resolution'>('speed')
	const [dropdownHeight, setDropdownHeight] = useState<'initial' | number>('initial')

	const dropdownRef = useRef<HTMLDivElement>(null)
	const indexMenuRef = useRef<HTMLDivElement>(null)
	const mainMenuRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!isMounted) return

		const outsideClickHandler = (event: MouseEvent) => {
			if (!isMounted || !dropdownRef.current) return
			if (!dropdownRef.current.contains(event.target as Node)) {
				onClose(false)
			}
		}

		document.addEventListener('click', outsideClickHandler)

		return () => {
			document.removeEventListener('click', outsideClickHandler)
		}
	}, [isMounted, onClose])

	useEffect(() => {
		if (!on) return
		setDropdownHeight(indexMenuRef.current?.offsetHeight || 'initial')
	}, [on])

	const dropdownEnteredHandler = useCallback(() => {
		setIsMounted(true)
	}, [])

	const dropdownExitedHandler = useCallback(() => {
		setIsMounted(false)
		setIsIndex(true)
		setDropdownHeight('initial')
	}, [])

	const calcHeight = useCallback((element: HTMLElement) => {
		setDropdownHeight(element.offsetHeight)
	}, [])

	const selectMenuHandler = useCallback((type: 'speed' | 'resolution') => {
		return () => {
			setIsIndex(false)
			setActiveType(type)
		}
	}, [])

	const selectPlaybackRateHandler = useCallback(
		(playbackRate: number) => {
			return () => {
				setIsIndex(true)
				onChangePlaybackRate(playbackRate)
			}
		},
		[onChangePlaybackRate]
	)

	const indexMenu = (
		<div className='vp-dropdown__menu' ref={indexMenuRef}>
			<ul className='vp-dropdown__list'>
				<li className='vp-dropdown__item' onClick={selectMenuHandler('speed')}>
					<span>Speed</span>
					<span>x {activePlaybackRate}</span>
				</li>
			</ul>
		</div>
	)

	const mainMenu = (
		<div className='vp-dropdown__menu' ref={mainMenuRef}>
			<div className='vp-dropdown__label' onClick={() => setIsIndex(true)}>
				<ArrowLeft />
				<span>
					{activeType === 'speed' && 'Speed'}
					{activeType === 'resolution' && 'Resolution'}
				</span>
			</div>
			<ul className='vp-dropdown__list'>
				{activeType === 'speed' &&
					playbackRates.map(playbackRate => (
						<li
							key={playbackRate}
							className={`vp-dropdown__item${activePlaybackRate === playbackRate ? ' active' : ''}`}
							onClick={selectPlaybackRateHandler(playbackRate)}
						>
							{playbackRate}
						</li>
					))}
			</ul>
		</div>
	)

	return (
		<CSSTransition
			in={on}
			classNames='vp-dropdown'
			timeout={200}
			mountOnEnter
			unmountOnExit
			onEntered={dropdownEnteredHandler}
			onExited={dropdownExitedHandler}
			nodeRef={dropdownRef}
		>
			<div className='vp-dropdown' ref={dropdownRef} style={{ height: dropdownHeight }}>
				<CSSTransition
					in={isIndex}
					classNames='vp-menu-index'
					timeout={300}
					mountOnEnter
					unmountOnExit
					onEnter={calcHeight}
					nodeRef={indexMenuRef}
				>
					{indexMenu}
				</CSSTransition>

				<CSSTransition
					in={!isIndex}
					classNames='vp-menu-main'
					timeout={300}
					mountOnEnter
					unmountOnExit
					onEnter={calcHeight}
					nodeRef={mainMenuRef}
				>
					{mainMenu}
				</CSSTransition>
			</div>
		</CSSTransition>
	)
}

export default memo(Dropdown)
