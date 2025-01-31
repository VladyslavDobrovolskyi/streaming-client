import ReactPlayer from 'react-player'

export default function RoomDev() {
	return (
		<div className='player-wrapper'>
			<ReactPlayer className='react-player' url='/movie/movie.mkv' controls width='100%' height='100%' />
		</div>
	)
}
