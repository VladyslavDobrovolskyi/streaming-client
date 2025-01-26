import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Room from './pages/Room'
import Main from './pages/Main'
import { Provider } from 'react-redux'
import store from './redux/store'

function App() {
	return (
		<Provider store={store}>
			<BrowserRouter>
				<Routes>
					<Route path='/room/:id' element={<Room />} />
					<Route path='/' element={<Main />} />
				</Routes>
			</BrowserRouter>
		</Provider>
	)
}

export default App
