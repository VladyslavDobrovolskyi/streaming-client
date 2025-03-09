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
	const [isResizing, setIsResizing] = useState(false)
	const [actionCursor, setActionCursor] = useState<string>('default')
	const [scale, setScale] = useState(1)
	const contentRef = useRef<HTMLDivElement>(null)

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
			const unscaledWidth = Math.round((newSize.width - 20) / scale)
			const unscaledHeight = Math.round((newSize.height - 20) / scale)

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

	const onStart = useCallback(() => {
		setTimeout(() => {
			setIsDragging(true)
			setActionCursor('grabbing')
		}, 100) // 100ms delay
	}, [])

	const onDrag = useCallback(
		(_e: DraggableEvent, data: DraggableData) => {
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
		setActionCursor('default')
	}, [])

	const getHandleStyle = useCallback(
		(position: string) => {
			const baseStyle: React.CSSProperties = {
				...resizeHandleStyles,
				zIndex: 12000,
				position: 'absolute',
				width: '20px',
				height: '20px',
				opacity: 0, // Make handles invisible
			}

			let cursor
			switch (position) {
				case 'sw':
					cursor = 'sw-resize'
					return { ...baseStyle, bottom: '-15px', left: '-15px', cursor }
				case 'nw':
					cursor = 'nw-resize'
					return { ...baseStyle, top: '-15px', left: '-15px', cursor }
				case 'se':
					cursor = 'se-resize'
					return { ...baseStyle, bottom: '-15px', right: '-15px', cursor }
				case 'ne':
					cursor = 'ne-resize'
					return { ...baseStyle, top: '-15px', right: '-15px', cursor }
				default:
					return baseStyle
			}
		},
		[resizeHandleStyles]
	)

	const onResizeStart = useCallback((e: React.MouseEvent) => {
		setIsResizing(true)
		setActionCursor(getComputedStyle(e.target as Element).cursor)
	}, [])

	const onResizeStop = useCallback(() => {
		setIsResizing(false)
		setActionCursor('default')
	}, [])

	useEffect(() => {
		const handleMouseUp = () => {
			if (isDragging) {
				setIsDragging(false)
				setActionCursor('default')
			}
			if (isResizing) {
				setIsResizing(false)
				setActionCursor('default')
			}
		}

		document.addEventListener('mouseup', handleMouseUp)
		return () => {
			document.removeEventListener('mouseup', handleMouseUp)
		}
	}, [isDragging, isResizing])

	useEffect(() => {
		if (isDragging || isResizing) {
			const style = document.createElement('style')
			style.innerHTML = `
        body * {
          cursor: ${actionCursor} !important;
          user-select: none !important;
        }
        .${dragHandleClassName}, .react-resizable-handle {
          pointer-events: auto !important;
        }
      `
			document.head.appendChild(style)
			return () => {
				document.head.removeChild(style)
			}
		}
	}, [isDragging, isResizing, actionCursor, dragHandleClassName])

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
				width={size.width * scale + 20}
				height={size.height * scale + 20}
				onResize={onResize}
				onResizeStart={onResizeStart}
				onResizeStop={onResizeStop}
				minConstraints={[minConstraints[0] * scale + 20, minConstraints[1] * scale + 20]}
				maxConstraints={[maxConstraints[0] * scale + 20, maxConstraints[1] * scale + 20]}
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
						top: '15px',
						left: '15px',
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
							cursor: isDragging || isResizing ? actionCursor : 'default',
						}}
						// className={dragHandleClassName}
					>
						{children({ isDragging })}
					</Box>
				</div>
			</Resizable>
		</Draggable>
	)
}

export default DraggableResizable
