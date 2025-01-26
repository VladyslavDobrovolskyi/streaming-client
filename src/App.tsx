import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Room from './pages/Room'
import Main from './pages/Main'
import LoginForm from './components/LoginForm'

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path='/room/:id' element={<Room />} />
				<Route path='/' element={<Main />} />
				<Route path='/login' element={<LoginForm />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App
