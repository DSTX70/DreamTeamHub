import { listPods } from './admin_ex'

export async function buildRoleTemplateJSON(){
  const pods = (await listPods()).map((p:any)=>p.name)
  const sample = [{
    handle: "NewHandle",
    title: "New Title",
    pod: pods[0] || "Marketing & Comms",
    purpose: "1–2 line purpose",
    core_functions: ["Item A","Item B"],
    definition_of_done: ["DoD A","DoD B"],
    tags: ["tag1","tag2"]
  }]
  return { pods, sample }
}

export async function buildAgentSpecTemplateJSON(){
  const pods = (await listPods()).map((p:any)=>p.name)
  const sample = [{
    handle: "NewHandle",
    title: "New Title",
    pod: pods[0] || "Marketing & Comms",
    thread_id: "",
    system_prompt: "You are NewHandle, New Title in the <Pod> pod. Keep outputs concise.",
    instruction_blocks: ["Follow brand-lock","Apply DoD consistently"],
    tools: ["threads.post","drive.search","zip.kit","hash.index"],
    policies: {"may_post_threads": false, "may_modify_drive": false}
  }]
  return { pods, sample }
}
