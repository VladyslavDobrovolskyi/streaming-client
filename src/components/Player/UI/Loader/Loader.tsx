import { memo, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'

import './Loader.css'

interface LoaderProps {
	on: boolean
	style?: React.CSSProperties
}

const Loader: React.FC<LoaderProps> = ({ on, style }) => {
	const nodeRef = useRef<HTMLDivElement>(null) // Создаем ref

	return (
		<CSSTransition
			in={on}
			classNames='vp-loader'
			timeout={300}
			mountOnEnter
			unmountOnExit
			nodeRef={nodeRef} // Передаем ref в CSSTransition
		>
			<div ref={nodeRef} className='vp-loader' style={style}>
				<div />
			</div>
		</CSSTransition>
	)
}

export default memo(Loader)
