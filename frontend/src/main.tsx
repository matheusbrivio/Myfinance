import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { MotionConfig } from 'motion/react'
import { Avisos } from './components/ui'
import { Cenas } from './layouts/Cenas'
import './styles/app.css'

const basename = /^\/app(?:\/|$)/.test(location.pathname) ? '/app' : '/'
createRoot(document.getElementById('root')!).render(<StrictMode>
  <MotionConfig reducedMotion="user"><BrowserRouter basename={basename}><Avisos>
    <Cenas/>
  </Avisos></BrowserRouter></MotionConfig>
</StrictMode>)
