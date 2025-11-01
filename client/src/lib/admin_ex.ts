import { apiRequest } from './queryClient'

export async function listPods() {
  const res = await fetch('/api/pods')
  return res.json()
}

export async function createPod(payload: any) {
  const res = await apiRequest('POST', '/api/pods', payload)
  return res.json()
}

export async function updatePod(id: number, payload: any) {
  const res = await apiRequest('PUT', `/api/pods/${id}`, payload)
  return res.json()
}

export async function deletePod(id: number) {
  await apiRequest('DELETE', `/api/pods/${id}`)
}

export async function listRoles() {
  const res = await fetch('/api/roles')
  return res.json()
}

export async function createRole(payload: any) {
  const res = await apiRequest('POST', '/api/roles', payload)
  return res.json()
}

export async function updateRole(id: number, payload: any) {
  const res = await apiRequest('PUT', `/api/roles/${id}`, payload)
  return res.json()
}

export async function listAgentSpecs() {
  const res = await fetch('/api/agent-specs')
  return res.json()
}

export async function upsertAgentSpec(payload: any) {
  const res = await apiRequest('POST', '/api/agent-specs', payload)
  return res.json()
}

export async function deleteAgentSpec(handle: string) {
  await apiRequest('DELETE', `/api/agent-specs/${handle}`)
}
