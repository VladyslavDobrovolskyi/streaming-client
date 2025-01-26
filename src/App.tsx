import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Room from './pages/Room'
import Main from './pages/Main'
import { Provider } from 'react-redux'
import store from './redux/store'

function App() {
	return (
		<BrowserRouter>
			<Provider store={store}>
				<Routes>
					<Route path='/room/:id' element={<Room />} />
					<Route path='/' element={<Main />} />
				</Routes>
			</Provider>
		</BrowserRouter>
	)
}

export default App
