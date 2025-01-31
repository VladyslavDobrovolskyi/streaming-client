interface BtnProps {
	label?: string
	onClick: () => void
	children?: React.ReactNode
}

const Btn: React.FC<BtnProps> = ({ label, onClick, children }) => {
	return (
		<button className={`vp-btn${label ? ' label' : ''}`} data-label={label} onClick={onClick}>
			{children}
		</button>
	)
}

export default Btn
