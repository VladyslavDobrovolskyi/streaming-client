'use client'

import type React from 'react'
import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Resizable, type ResizeCallbackData } from 'react-resizable'
import Draggable from 'react-draggable'
import 'react-resizable/css/styles.css'
import { Box } from '@radix-ui/themes'

interface DraggableResizableProps {
	children: (props: { isDragging: boolean }) => ReactNode
	initialSize?: { width: number; height: number }
	initialPosition?: { x: number; y: number }
	minConstraints?: [number, number]
	maxConstraints?: [number, number]
	dragHandleClassName?: string
	bounds?: string
	onPositionChange?: (position: { x: number; y: number }) => void
	onSizeChange?: (size: { width: number; height: number }) => void
	resizeHandleStyles?: React.CSSProperties
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
}) => {
	const [size, setSize] = useState(initialSize)
	const [position, setPosition] = useState(initialPosition)
	const [isDragging, setIsDragging] = useState(false)
	const scrollAreaRef = useRef<HTMLDivElement>(null)
	const [scale, setScale] = useState(1)

	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
		}
	}, [scrollAreaRef]) // Updated dependency

	const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
		e.preventDefault()
		const scaleFactor = 0.1
		const newScale = e.deltaY > 0 ? scale * (1 - scaleFactor) : scale * (1 + scaleFactor)
		setScale(Math.min(Math.max(newScale, 0.5), 2))
	}

	const onResize = (_: React.SyntheticEvent, { size: newSize, handle }: ResizeCallbackData) => {
		const deltaWidth = newSize.width - size.width
		const deltaHeight = newSize.height - size.height

		setSize(newSize)
		if (onSizeChange) onSizeChange(newSize)

		setPosition(prev => {
			let newX = prev.x
			let newY = prev.y

			if (handle.includes('w')) {
				newX -= deltaWidth
			}
			if (handle.includes('n')) {
				newY -= deltaHeight
			}

			const newPosition = { x: newX, y: newY }
			if (onPositionChange) onPositionChange(newPosition)
			return newPosition
		})
	}

	const onDrag = (_, data: { x: number; y: number }) => {
		const newPosition = { x: data.x, y: data.y }
		setPosition(newPosition)
		if (onPositionChange) onPositionChange(newPosition)
	}

	const onStart = () => setIsDragging(true)
	const onStop = () => setIsDragging(false)

	return (
		<Draggable
			handle={`.${dragHandleClassName}`}
			bounds={bounds}
			position={position}
			onDrag={onDrag}
			onStart={onStart}
			onStop={onStop}
		>
			<Resizable
				width={size.width}
				height={size.height}
				onResize={onResize}
				minConstraints={minConstraints}
				maxConstraints={maxConstraints}
				resizeHandles={['sw', 'nw', 'se', 'ne']}
				handle={(h, ref) => (
					<span
						ref={ref}
						className={`react-resizable-handle react-resizable-handle-${h}`}
						style={{
							...resizeHandleStyles,
							zIndex: 12000, // Ensure resize handles are above other elements
						}}
					/>
				)}
			>
				<div
					style={{
						width: size.width,
						height: size.height,
						position: 'absolute',
						zIndex: 12000,
					}}
				>
					<Box
						onWheel={handleWheel}
						style={{
							backgroundColor: 'var(--gray-1)',
							borderRadius: 'var(--radius-3)',
							overflow: 'hidden',
							display: 'flex',
							flexDirection: 'column',
							boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
							transform: `scale(${scale})`,
							transformOrigin: 'center',
							width: '100%',
							height: '100%',
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
