import React, { useEffect, useState } from 'react'
import { API, fetchRoles } from '../lib/api'

type Member = {
  handle: string; title: string; pod: string; podLabel: string; roleLabel: string;
  oneLiner: string; purpose: string; core: string[]; dod: string[];
}

const FALLBACK: Member[] = [
  { handle:"OS", title:"Orchestrator", pod:"control", podLabel:"Control Tower", roleLabel:"Lead",
    oneLiner:"Coordinate pods, priorities, mirrors, and escalations.", purpose:"Coordinate pods, priorities, mirrors, and escalations.",
    core:["Top-5 priorities","Escalation chase","Operating rhythm"], dod:["Owner+Due+Milestone+Next present","Artifacts linked","External-ready files attached"]
  },
  { handle:"Prism", title:"Marketing Lead", pod:"marketing", podLabel:"Marketing & Comms", roleLabel:"Lead",
    oneLiner:"Plan and execute GTM; own budgets, channel mix, and KPI lift.", purpose:"Plan and execute GTM; own budgets, channel mix, and KPI lift.",
    core:["Campaign briefs","Budget & KPIs","PR/Influencer"], dod:["Offer/Audience/Channels/KPIs locked","Approvals captured","Results summarized"]
  },
  { handle:"Aegis", title:"IP & Patent Counsel", pod:"ip", podLabel:"IP & Patent Program", roleLabel:"Counsel",
    oneLiner:"Translates invention into claims, figures, filings & risk memos.", purpose:"Own claims/spec/figures, filings, and patentability/FTO strategy.",
    core:["Claims drafting","FTO/patentability","Attorney packets"], dod:["Filed docs with confirmations","Docketed deadlines","Risk memo + mitigation plan"]
  },
  { handle:"Nova", title:"Art Director", pod:"brand", podLabel:"Brand & Assets", roleLabel:"Art Director",
    oneLiner:"Turns strategy into brand-locked, production-ready assets.", purpose:"Own visual system, gradient language, iconography, and export specs.",
    core:["Asset production","Template governance","Spec checks"], dod:["Assets match brand-lock","Specs validated","Versioned packages delivered"]
  }
]

export default function BrandingGrid(){
  const [members, setMembers] = useState<Member[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(()=>{
    (async()=>{
      try{
        const data = await fetchRoles()
        if(Array.isArray(data) && data.length){
          const mapped:Member[] = data.map((r:any)=>{
            const pod = String(r.pod || '').toLowerCase()
              .replaceAll('&','and').replaceAll(' ','-')
              .replace('marketing-and-comms','marketing')
              .replace('ip-and-patent-program','ip')
              .replace('security-and-compliance','security')
              .replace('brand-and-assets','brand')
              .replace('finance-and-bizops','finance')
              .replace('product-and-engineering','product')
            const one = String(r.purpose || '')
            return {
              handle: r.handle || '', title: r.title || '',
              pod, podLabel: r.pod || '', roleLabel: 'Role',
              oneLiner: one.length>130 ? one.slice(0,127).replace(/\s\S*$/,'') + '…' : one,
              purpose: r.purpose || '', core: r.core_functions || [], dod: r.definition_of_done || []
            }
          })
          setMembers(mapped)
        } else {
          setMembers(FALLBACK)
        }
      }catch{
        setMembers(FALLBACK)
      }
    })()
  }, [])

  const pods = Array.from(new Set(members.map(m=>m.pod))).sort()

  const labelForPod = (p:string)=>({
    marketing:"Marketing & Comms", ip:"IP & Patent Program", product:"Product & Engineering",
    security:"Security & Compliance", brand:"Brand & Assets", finance:"Finance & BizOps",
    control:"Control Tower", intake:"Intake & Routing", decision:"Decision Log", roster:"Roster & Roles", rhythm:"Operating Rhythm"
  } as any)[p] || p

  const items = filter==='all' ? members : members.filter(m=>m.pod===filter)

  return (
    <>
      <nav className="tabs">
        <div className={`tab ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>All Pods</div>
        {pods.map(p=>(
          <div key={p} className={`tab ${filter===p?'active':''}`} onClick={()=>setFilter(p)}>
            {labelForPod(p)}
          </div>
        ))}
      </nav>

      <main className="section">
        <div className="grid">
          {items.map((m,i)=>(<Card key={m.handle + i} m={m} />))}
        </div>
      </main>
    </>
  )
}

function Card({m}:{m:Member}){
  const [open, setOpen] = useState(false as boolean)
  return (
    <div className={`card pod-${m.pod}`} data-pod={m.pod}>
      <div className="rail" />
      <div className="inner">
        <div className="icon">✨</div>
        <div className="title">{m.handle} — {m.title}</div>
        <div className="chips">
          <span className="chip">{m.podLabel || ''}</span>
          <span className="chip">{m.roleLabel || 'Role'}</span>
        </div>
        <p className="oneliner">{m.oneLiner}</p>
        <button className="btn btn--secondary btn--sm" onClick={()=>setOpen(!open)}>
          {open ? 'Hide Full Profile' : 'View Full Profile'}
        </button>
        {open && (
          <div className="expand">
            <h4>Purpose</h4><p>{m.purpose}</p>
            {!!m.core?.length && (<><h4>Core Functions</h4><div className="tags">{m.core.map((x,i)=><span className="tag" key={i}>{x}</span>)}</div></>)}
            {!!m.dod?.length && (<><h4>Definition of Done</h4><ul>{m.dod.map((x,i)=><li key={i}>{x}</li>)}</ul></>)}
          </div>
        )}
      </div>
    </div>
  )
}
