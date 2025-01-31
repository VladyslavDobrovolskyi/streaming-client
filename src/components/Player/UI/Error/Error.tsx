import { memo } from 'react'
import { RefreshCw as ReloadIcon } from '@geist-ui/icons'
import './Error.css'

interface ErrorProps {
	error: MediaError | null
}

const Error: React.FC<ErrorProps> = ({ error }) => {
	const refreshHandler = () => {
		window.location.reload()
	}

	return error ? (
		<div className='vp-error'>
			<p>
				{error.code ? `${error.code}: ` : ''}
				{error.message || 'Error occurred! Please try again'}
			</p>
			<button onClick={refreshHandler}>
				<ReloadIcon />
			</button>
		</div>
	) : null
}

export default memo(Error)
