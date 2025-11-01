export type Role = {
  handle:string; title:string; pod:string;
  purpose?:string; core_functions?:string[]; definition_of_done?:string[]; tags?:string[];
}

export type AgentSpec = {
  handle:string; title:string; pod:string; thread_id?:string;
  system_prompt?:string; instruction_blocks?:string[]; tools?:string[]; policies?:any;
}

export type PolicyKeyDiff = {
  key: string;
  roleValue: any;     // always from baseline for policies
  agentValue: any;
  suggestion: any;
}

export type DiffItem = {
  field: string;
  roleValue: any;
  agentValue: any;
  suggestion?: any;
  policyKeyDiffs?: PolicyKeyDiff[];  // present when field === 'policies'
};

export const BASE_TOOLS = ["threads.post","drive.search","zip.kit","hash.index"];
export const BASE_POLICIES = {"may_post_threads": false, "may_modify_drive": false};

// Custom baseline system prompts per Pod
const POD_PROMPT_SEEDS: Record<string,string> = {
  "marketing & comms": "You are {handle}, {title} in the Marketing pod. Produce offer→audience→channels→budget→KPIs. Respect Brand-Lock and link assets.",
  "ip & patent program": "You are {handle}, {title} in the IP pod. Draft clear claims/spec notes; ensure figure legibility @66%; never disclose confidential details in public threads.",
  "security & compliance": "You are {handle}, {title} in Security. Prevent first, respond fast. Provide controls, playbooks, and risks with owners.",
  "brand & assets": "You are {handle}, {title} in Brand. Enforce Brand-Lock (color/typography/logo); deliver production-ready specs.",
  "product & engineering": "You are {handle}, {title} in Product. Provide AC, SLOs, and evidence artifacts; keep outputs concise.",
  "finance & bizops": "You are {handle}, {title} in Finance. Provide decision-grade views with assumptions and links to source sheets.",
  "control tower": "You are {handle}, {title} in Control Tower. Summarize priorities, owners, due, milestone, next step; link artifacts.",
};

function normPod(pod:string){ return (pod||'').toLowerCase().trim(); }

export function buildBaselinePrompt(handle:string, title:string, pod:string){
  const seed = POD_PROMPT_SEEDS[normPod(pod)] ||
    "You are {handle}, {title} in the {pod} pod. Keep outputs concise; respect Brand-Lock; apply Definition of Done and link artifacts.";
  return seed.replace("{handle}", handle).replace("{title}", title).replace("{pod}", pod);
}

function shallowEqualJSON(a:any, b:any){
  try{ return JSON.stringify(a ?? {}) === JSON.stringify(b ?? {}); }catch{ return false }
}

function diffPolicyKeys(agentPolicies:any): PolicyKeyDiff[] {
  const diffs: PolicyKeyDiff[] = [];
  const keys = new Set<string>([...Object.keys(BASE_POLICIES), ...Object.keys(agentPolicies||{})]);
  for(const k of keys){
    const baseVal = (BASE_POLICIES as any)[k];
    const agentVal = (agentPolicies||{})[k];
    if (JSON.stringify(baseVal) !== JSON.stringify(agentVal)){
      // Suggest baseline if undefined, or keep agent if defined but show difference
      const suggestion = (typeof agentVal === 'undefined') ? baseVal : ({...BASE_POLICIES, ...agentPolicies}[k]);
      diffs.push({ key: k, roleValue: baseVal, agentValue: agentVal, suggestion });
    }
  }
  return diffs;
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

  // System prompt baseline if empty or lacks key guidance
  const baselinePrompt = buildBaselinePrompt(r.handle, r.title, r.pod);
  const agentPrompt = a.system_prompt || "";
  if(!agentPrompt || !/Brand[- ]?Lock|Definition of Done|link artifacts/i.test(agentPrompt)){
    diffs.push({ field:"system_prompt", roleValue: baselinePrompt, agentValue: agentPrompt, suggestion: baselinePrompt });
  }

  // Policies: suggest merged baseline + show per-key differences
  const agentPolicies = a.policies ?? {};
  if(!shallowEqualJSON(agentPolicies, BASE_POLICIES)){
    diffs.push({
      field:"policies",
      roleValue: BASE_POLICIES,
      agentValue: agentPolicies,
      suggestion: { ...BASE_POLICIES, ...agentPolicies },
      policyKeyDiffs: diffPolicyKeys(agentPolicies)
    });
  }

  return diffs;
}
