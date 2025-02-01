import { createRoot } from 'react-dom/client'
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import './index.css'
import App from './App.tsx'
import { Provider } from 'react-redux'
import store from './redux/store.ts'

createRoot(document.getElementById('root')!).render(
	<>
		<Provider store={store}>
			<Theme accentColor='cyan' grayColor='slate' radius='full' scaling='110%'>
				<App />
			</Theme>
		</Provider>
	</>
)
