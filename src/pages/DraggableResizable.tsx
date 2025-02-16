'use client'

import type React from 'react'
import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { Resizable, type ResizeCallbackData } from 'react-resizable'
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable'
import 'react-resizable/css/styles.css'
import { Box } from '@radix-ui/themes'

interface DraggableResizableProps {
	children: (props: { isDragging: boolean }) => ReactNode
	initialSize?: { width: number; height: number }
	initialPosition?: { x: number; y: number }
	minConstraints?: [number, number]
	maxConstraints?: [number, number]
	dragHandleClassName?: string
	bounds?: string | false
	onPositionChange?: (position: { x: number; y: number }) => void
	onSizeChange?: (size: { width: number; height: number }) => void
	resizeHandleStyles?: React.CSSProperties
	disableWheelZoomClass?: string
	hide?: boolean
}

const DraggableResizable: React.FC<DraggableResizableProps> = ({
	children,
	initialSize = { width: 300, height: 400 },
	initialPosition = { x: 0, y: 0 },
	minConstraints = [200, 300],
	maxConstraints = [500, 600],
	dragHandleClassName = 'drag-handle',
	bounds = 'parent',
	onPositionChange,
	onSizeChange,
	resizeHandleStyles,
	disableWheelZoomClass,
	hide = false,
}) => {
	const [size, setSize] = useState(initialSize)
	const [position, setPosition] = useState(initialPosition)
	const [isDragging, setIsDragging] = useState(false)
	const [scale, setScale] = useState(1)
	const contentRef = useRef<HTMLDivElement>(null)
	const dragStartPosition = useRef({ x: 0, y: 0 })

	const handleWheel = useCallback(
		(e: React.WheelEvent<HTMLDivElement>) => {
			if (disableWheelZoomClass && (e.target as Element).closest(`.${disableWheelZoomClass}`)) {
				return
			}

			e.preventDefault()
			const scaleFactor = 0.1
			const newScale = e.deltaY > 0 ? scale * (1 - scaleFactor) : scale * (1 + scaleFactor)
			setScale(Math.min(Math.max(newScale, 0.5), 2))
		},
		[scale, disableWheelZoomClass]
	)

	const onResize = useCallback(
		(_: React.SyntheticEvent, { size: newSize, handle }: ResizeCallbackData) => {
			const unscaledWidth = Math.round(newSize.width / scale)
			const unscaledHeight = Math.round(newSize.height / scale)

			setSize({ width: unscaledWidth, height: unscaledHeight })
			if (onSizeChange) onSizeChange({ width: unscaledWidth, height: unscaledHeight })

			setPosition(prev => {
				let newX = prev.x
				let newY = prev.y

				if (handle.includes('w')) {
					newX -= (unscaledWidth - size.width) * scale
				}
				if (handle.includes('n')) {
					newY -= (unscaledHeight - size.height) * scale
				}

				const newPosition = { x: newX, y: newY }
				if (onPositionChange) onPositionChange(newPosition)
				return newPosition
			})
		},
		[scale, size, onSizeChange, onPositionChange]
	)

	const onStart = useCallback((e: DraggableEvent, data: DraggableData) => {
		setIsDragging(true)
		dragStartPosition.current = { x: data.x, y: data.y }
	}, [])

	const onDrag = useCallback(
		(e: DraggableEvent, data: DraggableData) => {
			const newPosition = {
				x: data.x,
				y: data.y,
			}
			setPosition(newPosition)
			if (onPositionChange) onPositionChange(newPosition)
		},
		[onPositionChange]
	)

	const onStop = useCallback(() => {
		setIsDragging(false)
	}, [])

	const getHandleStyle = useCallback(
		(position: string) => {
			const baseStyle: React.CSSProperties = {
				...resizeHandleStyles,
				zIndex: 12000,
				position: 'absolute',
			}

			switch (position) {
				case 'sw':
					return { ...baseStyle, bottom: 0, left: 0 }
				case 'nw':
					return { ...baseStyle, top: 0, left: 0 }
				case 'se':
					return { ...baseStyle, bottom: 0, right: 0 }
				case 'ne':
					return { ...baseStyle, top: 0, right: 0 }
				default:
					return baseStyle
			}
		},
		[resizeHandleStyles]
	)

	useEffect(() => {
		const handleMouseUp = () => {
			if (isDragging) {
				setIsDragging(false)
			}
		}

		document.addEventListener('mouseup', handleMouseUp)
		return () => {
			document.removeEventListener('mouseup', handleMouseUp)
		}
	}, [isDragging])

	return (
		<Draggable
			handle={`.${dragHandleClassName}`}
			bounds={bounds}
			position={position}
			onStart={onStart}
			onDrag={onDrag}
			onStop={onStop}
			defaultClassName={hide ? 'hidden' : 'react-draggable'}
		>
			<Resizable
				width={size.width * scale}
				height={size.height * scale}
				onResize={onResize}
				minConstraints={[minConstraints[0] * scale, minConstraints[1] * scale]}
				maxConstraints={[maxConstraints[0] * scale, maxConstraints[1] * scale]}
				resizeHandles={['sw', 'nw', 'se', 'ne']}
				handle={(h, ref) => (
					<span
						ref={ref}
						className={`react-resizable-handle react-resizable-handle-${h}`}
						style={getHandleStyle(h)}
					/>
				)}
			>
				<div
					style={{
						width: size.width * scale,
						height: size.height * scale,
						position: 'absolute',
						zIndex: 12000,
					}}
				>
					<Box
						onWheel={handleWheel}
						ref={contentRef}
						style={{
							backgroundColor: 'var(--gray-1)',
							borderRadius: 'var(--radius-3)',
							overflow: 'hidden',
							display: 'flex',
							flexDirection: 'column',
							boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
							transform: `scale(${scale})`,
							transformOrigin: 'top left',
							width: size.width,
							height: size.height,
						}}
					>
						{children({ isDragging })}
					</Box>
				</div>
			</Resizable>
		</Draggable>
	)
}

export default DraggableResizable
