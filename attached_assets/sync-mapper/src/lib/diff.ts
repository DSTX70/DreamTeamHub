export type Role = { handle:string; title:string; pod:string; purpose?:string; core_functions?:string[]; definition_of_done?:string[]; tags?:string[] }
export type AgentSpec = { handle:string; title:string; pod:string; thread_id?:string; system_prompt?:string; instruction_blocks?:string[]; tools?:string[]; policies?:any }
export type DiffItem = { field: string; roleValue: any; agentValue: any; suggestion?: any };
export function roleToSuggestedAgent(r: Role): AgentSpec {
  return { handle:r.handle, title:r.title, pod:r.pod, thread_id:"", system_prompt:`You are ${r.handle}, ${r.title} in the ${r.pod} pod. Keep outputs concise.`, instruction_blocks:(r.definition_of_done||[]).slice(), tools:["threads.post","drive.search","zip.kit","hash.index"], policies:{"may_post_threads":false,"may_modify_drive":false} };
}
export function diffRoleAgent(r: Role, a?: AgentSpec): DiffItem[] {
  if(!a){ return [{ field:"spec", roleValue:r, agentValue:null, suggestion: roleToSuggestedAgent(r)}]; }
  const diffs: DiffItem[] = [];
  if(r.title !== a.title) diffs.push({ field:"title", roleValue:r.title, agentValue:a.title, suggestion:r.title });
  if(r.pod !== a.pod) diffs.push({ field:"pod", roleValue:r.pod, agentValue:a.pod, suggestion:r.pod });
  const roleDoD = r.definition_of_done || []; const agentIB = a.instruction_blocks || []; if(roleDoD.length && !agentIB.length){ diffs.push({ field:"instruction_blocks", roleValue:roleDoD, agentValue:agentIB, suggestion:roleDoD }); }
  const baseTools = ["threads.post","drive.search","zip.kit","hash.index"]; const agentTools = a.tools || []; if(agentTools.length===0){ diffs.push({ field:"tools", roleValue:[], agentValue:agentTools, suggestion:baseTools }); }
  return diffs;
}
