export type Role = {
  handle:string; title:string; pod:string;
  purpose?:string; core_functions?:string[]; definition_of_done?:string[]; tags?:string[];
}

export type AgentSpec = {
  handle:string; title:string; pod:string; thread_id?:string;
  system_prompt?:string; instruction_blocks?:string[]; tools?:string[]; policies?:any;
}

export type DiffItem = {
  field: string;
  roleValue: any;
  agentValue: any;
  suggestion?: any;
};

export const BASE_TOOLS = ["threads.post","drive.search","zip.kit","hash.index"];
export const BASE_POLICIES = {"may_post_threads": false, "may_modify_drive": false};

export function buildBaselinePrompt(handle:string, title:string, pod:string){
  return `You are ${handle}, ${title} in the ${pod} pod. Keep outputs concise; respect Brand‑Lock; apply Definition of Done and link artifacts.`;
}

export function roleToSuggestedAgent(r: Role): AgentSpec {
  return {
    handle: r.handle,
    title: r.title,
    pod: r.pod,
    thread_id: "",
    system_prompt: buildBaselinePrompt(r.handle, r.title, r.pod),
    instruction_blocks: (r.definition_of_done || []).slice(),
    tools: BASE_TOOLS.slice(),
    policies: { ...BASE_POLICIES }
  };
}

function shallowEqualJSON(a:any, b:any){
  try{
    return JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});
  }catch{ return false }
}

export function diffRoleAgent(r: Role, a?: AgentSpec): DiffItem[] {
  if(!a){
    return [ { field: "spec", roleValue: r, agentValue: null, suggestion: roleToSuggestedAgent(r) } ];
  }
  const diffs: DiffItem[] = [];

  // Title / Pod
  if(r.title !== a.title) diffs.push({ field:"title", roleValue:r.title, agentValue:a.title, suggestion:r.title });
  if(r.pod !== a.pod) diffs.push({ field:"pod", roleValue:r.pod, agentValue:a.pod, suggestion:r.pod });

  // Instruction blocks from DoD if agent lacks them
  const roleDoD = r.definition_of_done || [];
  const agentIB = a.instruction_blocks || [];
  if(roleDoD.length && !agentIB.length){
    diffs.push({ field:"instruction_blocks", roleValue:roleDoD, agentValue:agentIB, suggestion:roleDoD });
  }

  // Tools baseline if empty
  const agentTools = a.tools || [];
  if(agentTools.length === 0){
    diffs.push({ field:"tools", roleValue:[], agentValue:agentTools, suggestion:BASE_TOOLS.slice() });
  }

  // System prompt baseline if empty or differs from a minimal baseline
  const baselinePrompt = buildBaselinePrompt(r.handle, r.title, r.pod);
  const agentPrompt = a.system_prompt || "";
  if(!agentPrompt){
    diffs.push({ field:"system_prompt", roleValue: baselinePrompt, agentValue: agentPrompt, suggestion: baselinePrompt });
  } else {
    // Offer suggestion only if the current prompt lacks key phrases
    const needsHint = !/Brand[‑-]Lock|Definition of Done|link artifacts/i.test(agentPrompt);
    if(needsHint){
      diffs.push({ field:"system_prompt", roleValue: baselinePrompt, agentValue: agentPrompt, suggestion: baselinePrompt });
    }
  }

  // Policies: suggest merged baseline if missing or different
  const agentPolicies = a.policies ?? {};
  if(!shallowEqualJSON(agentPolicies, BASE_POLICIES)){
    const merged = { ...BASE_POLICIES, ...agentPolicies };
    diffs.push({ field:"policies", roleValue: BASE_POLICIES, agentValue: agentPolicies, suggestion: merged });
  }

  return diffs;
}
