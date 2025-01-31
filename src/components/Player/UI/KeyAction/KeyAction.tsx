import { forwardRef, memo, useImperativeHandle, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'
import {
	Volume2 as VolumeHighIcon,
	Volume1 as VolumeMiddleIcon,
	Volume as VolumeLowIcon,
	VolumeX as VolumeMuteIcon,
	Rewind as TrackRewindIcon,
	FastForward as TrackSkipIcon,
} from '@geist-ui/icons'
import './KeyAction.css'

export interface KeyActionHandle {
	rewind: HTMLDivElement
	skip: HTMLDivElement
}

interface KeyActionProps {
	on: boolean
	volume: number
}

const KeyAction = forwardRef<KeyActionHandle, KeyActionProps>(({ on, volume }, ref) => {
	const rewindRef = useRef<HTMLDivElement>(null)
	const skipRef = useRef<HTMLDivElement>(null)
	const volumeRef = useRef<HTMLDivElement>(null)

	useImperativeHandle(ref, () => ({
		get rewind() {
			return rewindRef.current!
		},
		get skip() {
			return skipRef.current!
		},
	}))

	return (
		<div className='vp-key-action'>
			<CSSTransition
				in={on}
				classNames='vp-key-volume'
				timeout={300}
				mountOnEnter
				unmountOnExit
				nodeRef={volumeRef}
			>
				<div className='vp-key-action__volume' ref={volumeRef}>
					<div className='vp-key-action__volume__container'>
						<div className='vp-key-action__volume__icon'>
							{volume > 0.7 && <VolumeHighIcon />}
							{volume <= 0.7 && volume > 0.3 && <VolumeMiddleIcon />}
							{volume <= 0.3 && volume > 0 && <VolumeLowIcon />}
							{volume === 0 && <VolumeMuteIcon />}
						</div>
						<div className='vp-key-action__volume__range'>
							<div className='vp-key-action__volume__range--background' />
							<div
								className='vp-key-action__volume__range--current'
								style={{ width: `${volume * 100}%` }}
							/>
						</div>
					</div>
				</div>
			</CSSTransition>

			<div className='vp-key-action__progress rewind' ref={rewindRef}>
				<div className='vp-key-action__progress__container'>
					<TrackRewindIcon />
					<span>- 10 seconds</span>
				</div>
			</div>
			<div className='vp-key-action__progress skip' ref={skipRef}>
				<div className='vp-key-action__progress__container'>
					<TrackSkipIcon />
					<span>+ 10 seconds</span>
				</div>
			</div>
		</div>
	)
})

export default memo(KeyAction)
