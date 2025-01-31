import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GeistProvider, CssBaseline } from '@geist-ui/core'
import Room from './pages/Room'
import Main from './pages/Main'
import LoginForm from './components/LoginForm'
import RoomDev from './pages/RoomDev'

function App() {
	return (
		<GeistProvider>
			<CssBaseline />
			<BrowserRouter>
				<Routes>
					<Route path='/room/:id' element={<Room />} />
					<Route path='/' element={<Main />} />
					<Route path='/login' element={<LoginForm />} />
					<Route path='/roomdev' element={<RoomDev />} />
				</Routes>
			</BrowserRouter>
		</GeistProvider>
	)
}

export default App
