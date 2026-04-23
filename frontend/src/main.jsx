// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// ─────────────────────────────────────────────
// REMOVED StrictMode intentionally
// WHY: React StrictMode in development mounts every component TWICE
// to detect side effects. This causes:
// → 2 socket connections per user
// → 2 useEffect runs → 2 event listeners
// → Messages appearing duplicated or not at all
// In production builds StrictMode has no effect anyway
// We remove it during development to avoid socket confusion
createRoot(document.getElementById('root')).render(
  
  <App/>
 
)
