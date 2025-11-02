import React, { useEffect, useMemo, useRef, useState } from 'react'
import { listPods, createPod, updatePod, deletePod, listRoles, createRole, updateRole, listAgentSpecs, upsertAgentSpec, deleteAgentSpec } from '../lib/admin_ex'
import { toCSV, fromCSV } from '../lib/csv'
import { downloadText } from '../lib/download'
import { buildRoleTemplateJSON, buildAgentSpecTemplateJSON } from '../lib/templates'
import { COMMON_INSTRUCTION_BLOCKS } from '../lib/vocab'
import { CsvErrorModal } from './Modals'

type RoleCard = {
  id?: number
  handle: string; title: string; pod: string
  purpose?: string; core_functions?: string[]; responsibilities?: string[]
  definition_of_done?: string[]; links?: string[]; tags?: string[]
  tone_voice?: string
}

export default function RosterAdmin(){
  return (
    <div className="section" style={{display:'grid', gap:24}}>
      <PodsPanel/>
      <RolesPanel/>
      <AgentSpecsPanel/>
    </div>
  )
}

function FieldError({text}:{text:string}){ if(!text) return null; return <div style={{color:'#ff9898', fontSize:12, marginTop:4}}>{text}</div> }

function PodsPanel(){
  const [items, setItems] = useState<any[]>([])
  const [sel, setSel] = useState<any|null>(null)
  const [form, setForm] = useState({name:'', charter:'', owners:'', thread_id:''})
  const [errors, setErrors] = useState<{[k:string]:string}>({})

  useEffect(()=>{ (async()=>{ try{ setItems(await listPods()) }catch{ setItems([]) } })() }, [])

  useEffect(()=>{
    if(!sel) return
    setForm({ name: sel.name||'', charter: sel.charter||'', owners: (sel.owners||[]).join(', '), thread_id: sel.thread_id||'' })
    setErrors({})
  }, [sel])

  const ownersArray = useMemo(()=>form.owners.split(',').map(s=>s.trim()).filter(Boolean), [form.owners])

  const validate = ()=>{ const e:any = {}; if(!form.name.trim()) e.name = 'Pod name is required'; setErrors(e); return Object.keys(e).length===0 }

  const submit = async ()=>{
    if(!validate()) return
    const payload = { name: form.name.trim(), charter: form.charter, owners: ownersArray, thread_id: form.thread_id }
    if(sel?.id){ await updatePod(sel.id, payload) } else { await createPod(payload) }
    setItems(await listPods()); setSel(null); setForm({name:'', charter:'', owners:'', thread_id:''})
  }

  const remove = async (id:number)=>{ if(!confirm('Delete this Pod?')) return; await deletePod(id); setItems(await listPods()); if(sel?.id===id){ setSel(null); setForm({name:'', charter:'', owners:'', thread_id:''}) } }

  return (
    <section>
      <h2 style={{margin:'0 0 8px'}}>Pods — Onboard / Edit / Delete</h2>
      <div style={{display:'grid', gap:10, gridTemplateColumns:'repeat(auto-fit, minmax(260px,1fr))'}}>
        <div><input placeholder="Pod name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} style={errors.name?{border:'1px solid #ff6b6b'}:{}} /><FieldError text={errors.name}/></div>
        <input placeholder="Owners (comma-separated handles)" value={form.owners} onChange={e=>setForm({...form, owners:e.target.value})} />
        <input placeholder="Thread ID (optional)" value={form.thread_id} onChange={e=>setForm({...form, thread_id:e.target.value})} />
        <input placeholder="Charter (short)" value={form.charter} onChange={e=>setForm({...form, charter:e.target.value})} />
      </div>
      <div style={{marginTop:10, display:'flex', gap:8, flexWrap:'wrap'}}>
        <button className="btn" data-pod="control" onClick={submit}><span className="icon">💾</span>{sel?.id ? 'Update Pod' : 'Create Pod'}</button>
        {sel?.id ? <button className="btn btn--secondary btn--sm" onClick={()=>{ setSel(null); setForm({name:'', charter:'', owners:'', thread_id:''}); setErrors({}) }}>Cancel</button> : null}
      </div>

      <h3 style={{marginTop:16}}>Existing Pods</h3>
      <div style={{display:'grid', gap:10}}>
        {items.map((p:any)=>(
          <div key={p.id} className="card">
            <div className="rail"></div>
            <div className="inner">
              <div className="title">{p.name}</div>
              <div className="chips">
                <span className="chip">Owners: {(p.owners||[]).join(', ')}</span>
                {p.thread_id ? <span className="chip">thread: {p.thread_id}</span> : null}
              </div>
              <p className="oneliner">{p.charter || ''}</p>
              <div style={{display:'flex', gap:8}}>
                <button className="btn btn--secondary btn--sm" onClick={()=>setSel(p)}>Edit</button>
                <button className="btn btn--danger btn--sm" onClick={()=>remove(p.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function RolesPanel(){
  const [items, setItems] = useState<RoleCard[]>([])
  const [sel, setSel] = useState<RoleCard|null>(null)
  const [form, setForm] = useState<RoleCard>({handle:'', title:'', pod:'', purpose:'', core_functions:[], responsibilities:[], definition_of_done:[], links:[], tags:[], tone_voice:''})
  const [core, setCore] = useState('')
  const [dod, setDod] = useState('')
  const [tags, setTags] = useState('')
  const [errors, setErrors] = useState<{[k:string]:string}>({})

  const fileInputJSON = useRef<HTMLInputElement|null>(null)
  const fileInputCSV = useRef<HTMLInputElement|null>(null)

  // For Role↔Agent link display
  const [agentSpecs, setAgentSpecs] = useState<any[]>([])

  useEffect(()=>{ (async()=>{ try{ 
    const roles = await listRoles(); 
    const specs = await listAgentSpecs();
    console.log(`[RosterAdmin] Loaded ${roles.length} roles and ${specs.length} agent specs`);
    setItems(roles); 
    setAgentSpecs(specs);
  }catch(err){ 
    console.error('[RosterAdmin] Failed to load roles/specs:', err);
    setItems([]); 
    setAgentSpecs([]);
  } })() }, [])

  useEffect(()=>{
    if(!sel) return
    setForm({ id: sel.id, handle: sel.handle, title: sel.title, pod: sel.pod, purpose: sel.purpose || '', core_functions: (sel.core_functions||[]).slice(), responsibilities: (sel.responsibilities||[]).slice(), definition_of_done: (sel.definition_of_done||[]).slice(), links: (sel.links||[]).slice(), tags: (sel.tags||[]).slice(), tone_voice: sel.tone_voice || '' })
    setCore((sel.core_functions||[]).join('; ')); setDod((sel.definition_of_done||[]).join('; ')); setTags((sel.tags||[]).join(', ')); setErrors({})
  }, [sel])

  const validate = ()=>{ const e:any = {}; if(!form.handle.trim()) e.handle = 'Handle is required'; if(!form.title.trim()) e.title = 'Title is required'; if(!form.pod.trim()) e.pod = 'Pod is required'; setErrors(e); return Object.keys(e).length===0 }

  const submit = async ()=>{
    if(!validate()) return
    const payload = { handle: form.handle, title: form.title, pod: form.pod, purpose: form.purpose || '', core_functions: core.split(';').map(s=>s.trim()).filter(Boolean), responsibilities: form.responsibilities || [], definition_of_done: dod.split(';').map(s=>s.trim()).filter(Boolean), links: form.links || [], tags: tags.split(',').map(s=>s.trim()).filter(Boolean), tone_voice: form.tone_voice || '' }
    if(form.id){ await updateRole(form.id, payload) } else { await createRole(payload) }
    setItems(await listRoles()); setSel(null); setForm({handle:'', title:'', pod:'', purpose:'', core_functions:[], responsibilities:[], definition_of_done:[], links:[], tags:[], tone_voice:''}); setCore(''); setDod(''); setTags(''); setErrors({})
  }

  // Export
  const exportJSON = ()=> downloadText('roles.json', JSON.stringify(items, null, 2))
  const exportCSV = ()=>{ const rows = items.map(r=>({ handle:r.handle, title:r.title, pod:r.pod, purpose:r.purpose||'', core_functions:(r.core_functions||[]).join('; '), definition_of_done:(r.definition_of_done||[]).join('; '), tags:(r.tags||[]).join(', ') })); const csv = toCSV(rows, ['handle','title','pod','purpose','core_functions','definition_of_done','tags']); downloadText('roles.csv', csv) }

  // Import with error reporting
  const [csvErrors, setCsvErrors] = useState<{line:number,message:string}[]>([])
  const [csvModal, setCsvModal] = useState(false)

  const onImportJSON = async (file:File)=>{ const txt = await file.text(); try{ const arr = JSON.parse(txt); if(!Array.isArray(arr)) throw new Error('JSON must be an array of Role objects'); for(const r of arr){ const payload = { handle: r.handle, title: r.title, pod: r.pod, purpose: r.purpose||'', core_functions: (r.core_functions||String(r.core_functions||'').split(';')).map((s:any)=>String(s).trim()).filter(Boolean), definition_of_done: (r.definition_of_done||String(r.definition_of_done||'').split(';')).map((s:any)=>String(s).trim()).filter(Boolean), tags: (r.tags||String(r.tags||'').split(',')).map((s:any)=>String(s).trim()).filter(Boolean), responsibilities: r.responsibilities||[], links: r.links||[], tone_voice: r.tone_voice||'' }; if(!payload.handle||!payload.title||!payload.pod){ throw new Error('Missing required fields (handle/title/pod)') } await createRole(payload) } setItems(await listRoles()) } catch(e:any){ alert('JSON import error: ' + e.message) } }
  const onImportCSV = async (file:File)=>{ const txt = await file.text(); const { headers, rows } = fromCSV(txt); const idx=(h:string)=>headers.indexOf(h); const need=['handle','title','pod']; const errs:any[]=[]; for(const n of need){ if(idx(n)<0){ errs.push({line:1,message:`Missing header: ${n}`}) } } let line=2; for(const r of rows){ try{ const payload:any = { handle:r[idx('handle')], title:r[idx('title')], pod:r[idx('pod')], purpose:r[idx('purpose')]||'', core_functions:(r[idx('core_functions')]||'').split(';').map((s:any)=>String(s).trim()).filter(Boolean), definition_of_done:(r[idx('definition_of_done')]||'').split(';').map((s:any)=>String(s).trim()).filter(Boolean), tags:(r[idx('tags')]||'').split(',').map((s:any)=>String(s).trim()).filter(Boolean), responsibilities:[], links:[], tone_voice:'' }; if(!payload.handle||!payload.title||!payload.pod){ throw new Error('Missing required fields (handle/title/pod)') } await createRole(payload) } catch(e:any){ errs.push({line, message:e.message||String(e)}) } line++ } if(errs.length){ setCsvErrors(errs); setCsvModal(true) } setItems(await listRoles()) }

  // Role↔Agent link check
  const agentsByHandle = useMemo(()=>{ const m:any={}; for(const a of agentSpecs){ m[a.handle]=true } return m }, [agentSpecs])

  return (
    <section>
      <h2 style={{margin:'16px 0 8px'}}>Role Cards — Onboard & Edit</h2>
      <div style={{display:'grid', gap:10, gridTemplateColumns:'repeat(auto-fit, minmax(260px,1fr))'}}>
        <div><input placeholder="Handle" value={form.handle} onChange={e=>setForm({...form, handle:e.target.value})} style={errors.handle?{border:'1px solid #ff6b6b'}:{}} /><FieldError text={errors.handle}/></div>
        <div><input placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} style={errors.title?{border:'1px solid #ff6b6b'}:{}} /><FieldError text={errors.title}/></div>
        <div><PodPicker value={form.pod} onChange={v=>setForm({...form, pod:v})} /></div>
        <input placeholder="Tone/Voice (optional)" value={form.tone_voice||''} onChange={e=>setForm({...form, tone_voice:e.target.value})} />
        <input placeholder="Purpose (1–2 lines)" value={form.purpose||''} onChange={e=>setForm({...form, purpose:e.target.value})} />
        <input placeholder="Core Functions (semicolon-separated)" value={core} onChange={e=>setCore(e.target.value)} />
        <input placeholder="Definition of Done (semicolon-separated)" value={dod} onChange={e=>setDod(e.target.value)} />
        <input placeholder="Tags (comma-separated)" value={tags} onChange={e=>setTags(e.target.value)} />
      </div>
      <div style={{marginTop:10, display:'flex', gap:8, flexWrap:'wrap'}}>
        <button className="btn" data-pod="brand" onClick={submit}><span className="icon">💾</span>{form.id ? 'Update Role' : 'Create Role'}</button>
        {form.id ? <button className="btn btn--secondary btn--sm" onClick={()=>{ setSel(null); setForm({handle:'', title:'', pod:'', purpose:'', core_functions:[], responsibilities:[], definition_of_done:[], links:[], tags:[], tone_voice:''}); setCore(''); setDod(''); setTags(''); setErrors({}) }}>Cancel</button> : null}
        <input type="file" accept=".json" style={{display:'none'}} ref={fileInputJSON} onChange={e=>{ const f=e.target.files?.[0]; if(f) onImportJSON(f); (e.target as HTMLInputElement).value='' }} />
        <input type="file" accept=".csv" style={{display:'none'}} ref={fileInputCSV} onChange={e=>{ const f=e.target.files?.[0]; if(f) onImportCSV(f); (e.target as HTMLInputElement).value='' }} />
        <button className="btn btn--secondary btn--sm" onClick={()=>fileInputJSON.current?.click()}>Import JSON</button>
        <button className="btn btn--secondary btn--sm" onClick={()=>fileInputCSV.current?.click()}>Import CSV</button>
        <button className="btn btn--ghost btn--sm" onClick={()=>downloadText('roles_template.json', JSON.stringify({note:'Edit and import', template: true}, null, 2))}>Role Template (blank JSON)</button>
        <button className="btn btn--ghost btn--sm" onClick={exportJSON}>Export JSON</button>
        <button className="btn btn--ghost btn--sm" onClick={exportCSV}>Export CSV</button>
      </div>
      <CsvErrorModal open={csvModal} onClose={()=>setCsvModal(false)} errors={csvErrors} />

      <h3 style={{marginTop:16}}>Existing Roles ({items.length} total)</h3>
      <div style={{display:'grid', gap:10}} data-testid="roles-list">
        {items.map((r:RoleCard, index)=>(
          <RoleRow key={r.id || `${r.handle}-${index}`} r={r} hasAgent={!!agentsByHandle[r.handle]} />
        ))}
      </div>
    </section>
  )
}

function RoleRow({r, hasAgent}:{r:RoleCard, hasAgent:boolean}){
  const cloneToAgent = async ()=>{
    if(hasAgent){
      alert(`Agent spec for ${r.handle} already exists! View it in the "Agent Specs in DB" section below or on the Role ⇄ Agent Specs Sync page.`)
      return
    }
    try {
      const spec = {
        handle: r.handle, 
        title: r.title, 
        pod: r.pod, 
        threadId: '',
        systemPrompt: `You are ${r.handle}, ${r.title} in the ${r.pod} pod. Keep outputs concise.`,
        instructionBlocks: (r.definition_of_done||[]),
        tools: ['threads.post','drive.search','zip.kit','hash.index'],
        policies: {"may_post_threads": false, "may_modify_drive": false},
        autonomyLevel: 1
      }
      await upsertAgentSpec(spec)
      alert(`✅ Agent spec created for ${r.handle}! Scroll down to see it in "Agent Specs in DB" or refresh the page.`)
      window.location.reload()
    } catch(err) {
      console.error('Failed to clone agent:', err)
      alert(`❌ Failed to create agent spec: ${err}`)
    }
  }
  return (
    <div className="card">
      <div className="rail"></div>
      <div className="inner">
        <div className="title">
          {r.handle} — {r.title} {hasAgent ? <span className="chip" style={{backgroundColor:'#22c55e'}}>✓ Agent Exists</span> : <span className="chip" style={{backgroundColor:'#666'}}>No Agent</span>}
        </div>
        <div className="chips"><span className="chip">{r.pod}</span>{(r.tags||[]).map((t,i)=><span className="chip" key={i}>{t}</span>)}</div>
        <p className="oneliner">{r.purpose||''}</p>
        <div style={{display:'flex', gap:8}}>
          {hasAgent ? (
            <button className="btn btn--ghost btn--sm" onClick={cloneToAgent} data-testid={`button-view-agent-${r.handle}`}>
              <span className="icon">✓</span>Agent Already Exists
            </button>
          ) : (
            <button className="btn btn--secondary btn--sm" onClick={cloneToAgent} data-testid={`button-clone-agent-${r.handle}`}>
              <span className="icon">🤖</span>Create Agent Spec
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PodPicker({value,onChange}:{value:string,onChange:(v:string)=>void}){
  const [pods,setPods]=useState<any[]>([])
  useEffect(()=>{(async()=>{try{setPods(await listPods())}catch{setPods([])}})()},[])
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}>
      <option value="">Select Pod…</option>
      {pods.map(p=>(<option key={p.id} value={p.name}>{p.name}</option>))}
    </select>
  )
}

function AgentSpecsPanel(){
  const [items, setItems] = useState<any[]>([])
  const [sel, setSel] = useState<any|null>(null)
  const [form, setForm] = useState<any>({
    handle:'', title:'', pod:'', thread_id:'',
    system_prompt:'',
    instruction_blocks:'', tools:'threads.post,drive.search,zip.kit,hash.index',
    policies:'{"may_post_threads":false,"may_modify_drive":false}'
  })
  const [errors, setErrors] = useState<{[k:string]:string}>({})
  const fileJSON = useRef<HTMLInputElement|null>(null)
  const fileCSV = useRef<HTMLInputElement|null>(null)

  async function refresh(){ try{ const d = await listAgentSpecs(); console.log(`[AgentSpecsPanel] Loaded ${d.length} agent specs`); setItems(d) } catch(err) { console.error('[AgentSpecsPanel] Failed to load specs:', err); setItems([]) } }
  useEffect(()=>{ refresh(); const stash=localStorage.getItem('clone_agent_spec_from_role'); if(stash){ try{ const spec=JSON.parse(stash); setForm({ ...form, ...spec, instruction_blocks:(spec.instruction_blocks||[]).join('\n'), tools:(spec.tools||[]).join(',') }); localStorage.removeItem('clone_agent_spec_from_role') }catch{} } }, [])

  useEffect(()=>{
    if(!sel) return
    setForm({
      handle: sel.handle || '',
      title: sel.title || '',
      pod: sel.pod || '',
      thread_id: sel.thread_id || '',
      system_prompt: sel.system_prompt || '',
      instruction_blocks: (sel.instruction_blocks||[]).join('\n'),
      tools: (sel.tools||[]).join(','),
      policies: JSON.stringify(sel.policies||{}, null, 0)
    })
    setErrors({})
  }, [sel])

  const validate = ()=>{
    const e:any = {}
    if(!form.handle.trim()) e.handle = 'Handle is required'
    if(!form.title.trim()) e.title = 'Title is required'
    if(!form.pod.trim()) e.pod = 'Pod is required'
    try{ JSON.parse(form.policies || '{}') }catch{ e.policies = 'Policies JSON is invalid' }
    setErrors(e); return Object.keys(e).length===0
  }

  const submit = async ()=>{
    if(!validate()) return
    const payload = {
      handle: form.handle, title: form.title, pod: form.pod, thread_id: form.thread_id || '',
      system_prompt: form.system_prompt || `You are ${form.handle}, ${form.title} in the ${form.pod} pod.`,
      instruction_blocks: (form.instruction_blocks||'').split('\n').map((s:string)=>s.trim()).filter(Boolean),
      tools: (form.tools||'').split(',').map((s:string)=>s.trim()).filter(Boolean),
      policies: (()=>{ try{ return JSON.parse(form.policies||'{}') } catch{ return {} }})()
    }
    await upsertAgentSpec(payload)
    await refresh()
    setSel(null)
    setForm({handle:'', title:'', pod:'', thread_id:'', system_prompt:'', instruction_blocks:'', tools:'threads.post,drive.search,zip.kit,hash.index', policies:'{"may_post_threads":false,"may_modify_drive":false}'})
    setErrors({})
  }

  const remove = async (h:string)=>{ if(!confirm('Delete this Agent Spec?')) return; await deleteAgentSpec(h); await refresh(); if(sel?.handle===h){ setSel(null) } }

  // Export
  const exportJSON = ()=> downloadText('agent_specs.json', JSON.stringify(items, null, 2))
  const exportCSV = ()=>{
    const rows = items.map((a:any)=>({
      handle:a.handle, title:a.title, pod:a.pod, thread_id:a.thread_id||'',
      system_prompt:(a.system_prompt||'').replaceAll('\n',' / '),
      instruction_blocks:(a.instruction_blocks||[]).join(' | '),
      tools:(a.tools||[]).join(' | '),
      policies: JSON.stringify(a.policies||{})
    }))
    const csv = toCSV(rows, ['handle','title','pod','thread_id','system_prompt','instruction_blocks','tools','policies'])
    downloadText('agent_specs.csv', csv)
  }

  // Import with error reporting and vocab helper
  const [csvErrors, setCsvErrors] = useState<{line:number,message:string}[]>([])
  const [csvModal, setCsvModal] = useState(false)

  const onImportJSON = async (file:File)=>{
    const txt = await file.text()
    try{
      const arr = JSON.parse(txt)
      if(!Array.isArray(arr)) throw new Error('JSON must be an array of AgentSpec objects')
      for(const a of arr){
        const payload = {
          handle: a.handle, title: a.title, pod: a.pod,
          thread_id: a.thread_id||'',
          system_prompt: a.system_prompt||'',
          instruction_blocks: (a.instruction_blocks||String(a.instruction_blocks||'').split('|')).map((s:any)=>String(s).trim()).filter(Boolean),
          tools: (a.tools||String(a.tools||'').split('|')).map((s:any)=>String(s).trim()).filter(Boolean),
          policies: (()=>{ try{ return typeof a.policies==='string' ? JSON.parse(a.policies) : (a.policies||{}) } catch{ return {} }})()
        }
        if(!payload.handle||!payload.title||!payload.pod){ throw new Error('Missing required fields (handle/title/pod)') }
        await upsertAgentSpec(payload)
      }
      await refresh()
    } catch(e:any){
      alert('AgentSpec JSON import error: ' + e.message)
    }
  }

  const onImportCSV = async (file:File)=>{
    const txt = await file.text()
    const lines = txt.split(/\r?\n/).filter(Boolean)
    const headers = lines.shift()?.split(',')?.map(s=>s.trim()) || []
    const idx = (h:string)=>headers.indexOf(h)
    const need = ['handle','title','pod']
    const errs:any[] = []
    if(need.some(h=>idx(h)<0)){ errs.push({line:1, message:'CSV must include headers: ' + need.join(',')}) }
    let line = 2
    for(const lineStr of lines){
      try{
        const cols = lineStr.split(',').map(s=>s.trim())
        const payload:any = {
          handle: cols[idx('handle')], title: cols[idx('title')], pod: cols[idx('pod')],
          thread_id: (idx('thread_id')>=0? cols[idx('thread_id')] : ''),
          system_prompt: (idx('system_prompt')>=0? cols[idx('system_prompt')] : ''),
          instruction_blocks: (idx('instruction_blocks')>=0? cols[idx('instruction_blocks')].split('|').map(s=>s.trim()).filter(Boolean) : []),
          tools: (idx('tools')>=0? cols[idx('tools')].split('|').map(s=>s.trim()).filter(Boolean) : []),
          policies: (()=>{ try{ return idx('policies')>=0? JSON.parse(cols[idx('policies')]||'{}') : {} } catch{ throw new Error('Invalid JSON in policies') }})()
        }
        if(!payload.handle||!payload.title||!payload.pod) throw new Error('Missing required fields (handle/title/pod)')
        await upsertAgentSpec(payload)
      }catch(e:any){
        errs.push({line, message: e.message || String(e)})
      }
      line++
    }
    if(errs.length){ setCsvErrors(errs); setCsvModal(true) }
    await refresh()
  }

  // Templates pre-filled
  const exportTemplate = async ()=>{
    const tmpl = await buildAgentSpecTemplateJSON()
    downloadText('agent_spec_template.json', JSON.stringify(tmpl, null, 2))
  }

  return (
    <section>
      <h2 style={{margin:'16px 0 8px'}}>Agent Specs — Persisted (CRUD) + Import/Export + Templates</h2>
      <div style={{display:'grid', gap:10, gridTemplateColumns:'repeat(auto-fit, minmax(260px,1fr))'}}>
        <div><input placeholder="Handle" value={form.handle} onChange={e=>setForm({...form, handle:e.target.value})} style={errors.handle?{border:'1px solid #ff6b6b'}:{}} /><FieldError text={errors.handle}/></div>
        <div><input placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} style={errors.title?{border:'1px solid #ff6b6b'}:{}} /><FieldError text={errors.title}/></div>
        <div><PodPicker value={form.pod} onChange={v=>setForm({...form, pod:v})} /></div>
        <input placeholder="Thread ID (optional)" value={form.thread_id} onChange={e=>setForm({...form, thread_id:e.target.value})} />
        <input placeholder="Tools (comma-separated)" value={form.tools} onChange={e=>setForm({...form, tools:e.target.value})} />
        <textarea placeholder="Instruction Blocks (one per line)" rows={3} value={form.instruction_blocks} onChange={e=>setForm({...form, instruction_blocks:e.target.value})} />
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span className="chip">Common Blocks:</span>
          <select onChange={e=>{ const val=e.target.value; if(val) setForm({...form, instruction_blocks: (form.instruction_blocks ? form.instruction_blocks+'\n' : '') + val}) }}>
            <option value="">Choose…</option>
            {COMMON_INSTRUCTION_BLOCKS.map((b,i)=>(<option key={i} value={b}>{b}</option>))}
          </select>
        </div>
        <textarea placeholder="System Prompt (optional override)" rows={3} value={form.system_prompt} onChange={e=>setForm({...form, system_prompt:e.target.value})} />
        <textarea placeholder="Policies (JSON)" rows={3} value={form.policies} onChange={e=>setForm({...form, policies:e.target.value})} style={errors.policies?{border:'1px solid #ff6b6b'}:{}} />
        <FieldError text={errors.policies||''}/>
      </div>
      <div style={{marginTop:10, display:'flex', gap:8, flexWrap:'wrap'}}>
        <button className="btn" data-pod="product" onClick={submit}><span className="icon">🤖</span>{sel ? 'Update Spec' : 'Create/Upsert Spec'}</button>
        {sel ? <button className="btn btn--secondary btn--sm" onClick={()=>{ setSel(null); setForm({handle:'', title:'', pod:'', thread_id:'', system_prompt:'', instruction_blocks:'', tools:'threads.post,drive.search,zip.kit,hash.index', policies:'{"may_post_threads":false,"may_modify_drive":false}'}); setErrors({}) }}>Cancel</button> : null}
        <input type="file" accept=".json" style={{display:'none'}} ref={fileJSON} onChange={e=>{ const f=e.target.files?.[0]; if(f) onImportJSON(f); (e.target as HTMLInputElement).value='' }} />
        <input type="file" accept=".csv" style={{display:'none'}} ref={fileCSV} onChange={e=>{ const f=e.target.files?.[0]; if(f) onImportCSV(f); (e.target as HTMLInputElement).value='' }} />
        <button className="btn btn--secondary btn--sm" onClick={()=>fileJSON.current?.click()}>Import JSON</button>
        <button className="btn btn--secondary btn--sm" onClick={()=>fileCSV.current?.click()}>Import CSV</button>
        <button className="btn btn--ghost btn--sm" onClick={exportJSON}>Export JSON</button>
        <button className="btn btn--ghost btn--sm" onClick={exportCSV}>Export CSV</button>
        <button className="btn btn--ghost btn--sm" onClick={exportTemplate}>Spec Template (pods + sample)</button>
      </div>
      <CsvErrorModal open={csvModal} onClose={()=>setCsvModal(false)} errors={csvErrors} />

      <h3 style={{marginTop:16}}>Agent Specs in DB ({items.length} total)</h3>
      <div style={{display:'grid', gap:10}} data-testid="agent-specs-list">
        {items.map((a:any)=>(
          <div key={a.handle} className="card" data-testid={`agent-card-${a.handle}`}>
            <div className="rail"></div>
            <div className="inner">
              <div className="title">{a.handle} — {a.title}</div>
              <div className="chips">
                <span className="chip">{a.pod}</span>
                {a.autonomyLevel !== undefined && (
                  <span className="chip">L{a.autonomyLevel}</span>
                )}
                {a.thread_id ? <span className="chip">thread: {a.thread_id}</span> : null}
              </div>
              <p className="oneliner">{(a.system_prompt||'').slice(0,160)}{(a.system_prompt||'').length>160?'…':''}</p>
              <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                <button className="btn btn--secondary btn--sm" onClick={()=>setSel(a)}>Edit</button>
                <button className="btn btn--danger btn--sm" onClick={()=>{ if(confirm('Delete this Agent Spec?')) deleteAgentSpec(a.handle).then(refresh) }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
