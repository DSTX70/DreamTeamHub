import React, { useEffect, useState } from 'react'
import { fetchAgents, runAgent, sendFeedback, fetchMemory, semanticSearch } from '../lib/api'

export default function AgentConsole(){
  const [agents, setAgents] = useState<any[]>([])
  const [sel, setSel] = useState<string>('')
  const [task, setTask] = useState('Draft Week-1 OUAS A+ outline')
  const [out, setOut] = useState('')
  const [post, setPost] = useState(false)
  const [mem, setMem] = useState<any[]>([])
  const [query, setQuery] = useState('hooks and CTA variants')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    (async()=>{
      try{
        const d = await fetchAgents()
        const arr = d.agents || []
        setAgents(arr)
        if(arr.length) {
          setSel(arr[0].handle)
        }
      }catch{ /* ignore */ }
    })()
  }, [])

  useEffect(()=>{ if(!sel) return; (async()=>{
    try{
      const d = await fetchMemory(sel, 10)
      setMem(d.items || [])
    }catch{ setMem([]) }
  })() }, [sel])

  const doRun = async ()=>{
    if(!sel || !task.trim()) return
    setLoading(true); setOut('')
    try{
      const res = await runAgent(sel, task, post)
      setOut(res.output || '')
      const d = await fetchMemory(sel, 10)
      setMem(d.items || [])
    }finally{ setLoading(false) }
  }

  const doFeedback = async (txt:string)=>{
    if(!sel || !txt.trim()) return
    await sendFeedback(sel, txt, 2, 'feedback')
    const d = await fetchMemory(sel, 10)
    setMem(d.items || [])
  }

  const doSearch = async ()=>{
    try{
      const res = await semanticSearch(sel, query, 5)
      alert('Top matches:\n' + (res.items||[]).map((x:any)=>`${(x.score||0).toFixed(3)} — ${String(x.text||'').slice(0,80)}`).join('\n'))
    }catch(e:any){
      alert('Semantic search not available: ' + (e?.message||'Unknown'))
    }
  }

  return (
    <div className="section">
      <div style={{display:'flex', gap:10, flexWrap:'wrap', marginBottom:14}}>
        <select value={sel} onChange={e=>setSel(e.target.value)} className="btn btn--secondary">
          {agents.map(a => <option key={a.handle} value={a.handle}>{a.handle} — {a.title}</option>)}
        </select>
        <label><input type="checkbox" checked={post} onChange={e=>setPost(e.target.checked)} /> Post to thread</label>
      </div>

      <textarea value={task} onChange={e=>setTask(e.target.value)} rows={4} style={{width:'100%', padding:12, borderRadius:12}} />

      <div style={{display:'flex', gap:10, margin:'10px 0'}}>
        <button className="btn" onClick={doRun} disabled={loading}>{loading? 'Running…' : 'Run Agent'}</button>
        <input placeholder="Quick feedback (press Enter)" onKeyDown={e=>{
          if(e.key==='Enter'){ doFeedback((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value='' }
        }} style={{flex:1, padding:'10px 12px', borderRadius:12}} />
      </div>

      <h3>Output</h3>
      <pre style={{whiteSpace:'pre-wrap', background:'#11162a', padding:16, borderRadius:12}}>{out}</pre>

      <h3>Recent Memory</h3>
      <ul>{mem.map((m:any,i:number)=>(<li key={i}><b>{m.kind}</b>: {m.content}</li>))}</ul>

      <div style={{marginTop:12, display:'flex', gap:10}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Semantic query" style={{flex:1, padding:'10px 12px', borderRadius:12}} />
        <button className="btn btn--secondary" onClick={doSearch}>Semantic Search</button>
      </div>
    </div>
  )
}
