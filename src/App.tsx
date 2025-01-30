import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Room from './pages/Room'
import Main from './pages/Main'
import LoginForm from './components/LoginForm'
import Roomdev from './pages/Roomdev'

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path='/room/:id' element={<Room />} />
				<Route path='/' element={<Main />} />
				<Route path='/login' element={<LoginForm />} />
				<Route path='/roomdev' element={<Roomdev />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App
