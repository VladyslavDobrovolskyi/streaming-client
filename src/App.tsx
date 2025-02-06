import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GeistProvider, CssBaseline } from '@geist-ui/core'
// import Room from './pages/Room'
import Main from './pages/Main'
import LoginForm from './components/LoginForm'
import RegistrationForm from './components/RegistrationForm'
import RoomDev from './pages/RoomDev'
import ARoom from './pages/Aroom'
import IconPage from './pages/IconPage'

function App() {
	return (
		<GeistProvider>
			<CssBaseline />
			<BrowserRouter>
				<Routes>
					<Route path='/room/:id' element={<RoomDev />} />
					<Route path='/' element={<Main />} />
					<Route path='/registration' element={<RegistrationForm />} />
					<Route path='/login' element={<LoginForm />} />
					<Route path='/roomdev' element={<RoomDev />} />
					<Route path='/aroom' element={<ARoom />} />
					<Route path='/icons' element={<IconPage />} />
				</Routes>
			</BrowserRouter>
		</GeistProvider>
	)
}

export default App
