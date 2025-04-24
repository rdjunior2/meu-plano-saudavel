import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { syncAuthToken } from './lib/supabaseClient'

// Sincronizar tokens antes de inicializar a aplicação
syncAuthToken();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
