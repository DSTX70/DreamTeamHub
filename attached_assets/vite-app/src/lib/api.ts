export const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function fetchRoles(){
  const r = await fetch(`${API}/roles`)
  if(!r.ok) throw new Error('HTTP ' + r.status)
  return await r.json()
}

export async function fetchAgents(){
  const r = await fetch(`${API}/agents`)
  if(!r.ok) throw new Error('HTTP ' + r.status)
  return await r.json()
}

export async function runAgent(agent: string, task: string, postToThread=false){
  const r = await fetch(`${API}/agents/run`, {
    method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify({ agent, task, links:[], post_to_thread: postToThread })
  })
  if(!r.ok) throw new Error('HTTP ' + r.status)
  return await r.json()
}

export async function sendFeedback(agent: string, feedback: string, score=1, kind='feedback'){
  const r = await fetch(`${API}/agents/feedback`, {
    method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify({ agent, feedback, score, kind })
  })
  if(!r.ok) throw new Error('HTTP ' + r.status)
  return await r.json()
}

export async function fetchMemory(handle: string, limit=10){
  const r = await fetch(`${API}/agents/${handle}/memory?limit=${limit}`)
  if(!r.ok) throw new Error('HTTP ' + r.status)
  return await r.json()
}

export async function semanticSearch(handle: string, query: string, topK=5){
  const r = await fetch(`${API}/agents/semantic/search`, {
    method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify({ handle, query, top_k: topK })
  })
  if(!r.ok) throw new Error('HTTP ' + r.status)
  return await r.json()
}
