import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GeistProvider, CssBaseline } from '@geist-ui/core'
// import Room from './pages/Room'
import Main from './pages/MainPage'
import LoginPage from './pages/LoginPage'
import RegistrationPage from './pages/RegistrationPage'
import RoomPage from './pages/RoomPage'

function App() {
	return (
		<GeistProvider>
			<CssBaseline />
			<BrowserRouter>
				<Routes>
					<Route path='/' element={<Main />} />
					<Route path='/login' element={<LoginPage />} />
					<Route path='/registration' element={<RegistrationPage />} />
					<Route path='/room/:id' element={<RoomPage />} />
				</Routes>
			</BrowserRouter>
		</GeistProvider>
	)
}

export default App
