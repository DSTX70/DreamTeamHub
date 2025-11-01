import React, { useState } from 'react'
import BrandingGrid from './components/BrandingGrid'
import AgentConsole from './components/AgentConsole'

export default function App(){
  const [tab, setTab] = useState<'grid'|'agents'>('grid')
  return (
    <div>
      <header className="hero">
        <h1 className="h1">Dream Team Hub</h1>
        <p className="sub">Modern gradients, glass UI, pod-coded identity + live Agent Console.</p>
        <div className="hero-actions">
          <button className={`btn btn--secondary ${tab==='grid'?'is-active':''}`} onClick={()=>setTab('grid')}>Branding Grid</button>
          <button className={`btn ${tab==='agents'?'is-active':''}`} data-pod="product" onClick={()=>setTab('agents')}><span className="icon">🤖</span>Agent Console</button>
        </div>
      </header>
      {tab === 'grid' ? <BrandingGrid/> : <AgentConsole/>}
      <footer className="footer">
        <div className="row">
          <span>© i³ Collective — Dream Team Hub</span>
        </div>
      </footer>
    </div>
  )
}
