import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GeistProvider, CssBaseline } from '@geist-ui/core'
// import Room from './pages/Room'
import MainV2 from './pages/MainV2'
import LoginPage from './pages/LoginPage'
import RegistrationPage from './pages/RegistrationPage'
import RoomPage from './pages/RoomPage'
import JoinRoomPage from './pages/JoinPage'

function App() {
	return (
		<GeistProvider>
			<CssBaseline />
			<BrowserRouter>
				<Routes>
					<Route path='/' element={<MainV2 />} />
					<Route path='/login' element={<LoginPage />} />
					<Route path='/registration' element={<RegistrationPage />} />
					<Route path='/join/:roomId' element={<JoinRoomPage />} />
					<Route path='/room/:id' element={<RoomPage />} />
				</Routes>
			</BrowserRouter>
		</GeistProvider>
	)
}

export default App
