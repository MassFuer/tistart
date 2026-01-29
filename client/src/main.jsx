import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import '@fontsource/inter'; 
import '@fontsource/geist-sans';
import '@fontsource/manrope';
import '@fontsource/poppins';
import '@fontsource/roboto';
import './i18n'; // Import i18n configuration
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
