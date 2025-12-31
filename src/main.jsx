import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
/* 
   THE CRITICAL MODULE: 
   BrowserRouter provides the context for useNavigate()
*/
import { BrowserRouter } from 'react-router-dom' 
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> 
       {/* 
          HQ PROTOCOL: Wrap App to enable routing logic 
          across all terminal sub-modules.
       */}
       <App />
    </BrowserRouter>
  </StrictMode>,
)