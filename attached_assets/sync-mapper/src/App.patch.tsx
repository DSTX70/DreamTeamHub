import React, { useState } from 'react'
import BrandingGrid from './components/BrandingGrid'
import AgentConsole from './components/AgentConsole'
import RosterAdmin from './components/RosterAdmin'
import RoleAgentSync from './components/RoleAgentSync'
export default function App(){
  const [tab,setTab]=useState<'grid'|'agents'|'admin'|'sync'>('grid')
  return(<div><header className="hero"><h1 className="h1">Dream Team Hub</h1><p className="sub">Branding Grid · Agent Console · Roster Admin · Roles⇄Agent Specs Sync</p><div className="hero-actions"><button className={`btn btn--secondary ${tab==='grid'?'is-active':''}`} onClick={()=>setTab('grid')}>Branding Grid</button><button className={`btn ${tab==='agents'?'is-active':''}`} data-pod="product" onClick={()=>setTab('agents')}><span className="icon">🤖</span>Agent Console</button><button className={`btn ${tab==='admin'?'is-active':''}`} data-pod="control" onClick={()=>setTab('admin')}><span className="icon">🗂️</span>Roster Admin</button><button className={`btn ${tab==='sync'?'is-active':''}`} data-pod="brand" onClick={()=>setTab('sync')}><span className="icon">🔄</span>Roles⇄Specs Sync</button></div></header>{tab==='grid'?<BrandingGrid/>:tab==='agents'?<AgentConsole/>:tab==='admin'?<RosterAdmin/>:<RoleAgentSync/>}<footer className="footer"><div className="row"><span>© i³ Collective — Dream Team Hub</span></div></footer></div>)}
