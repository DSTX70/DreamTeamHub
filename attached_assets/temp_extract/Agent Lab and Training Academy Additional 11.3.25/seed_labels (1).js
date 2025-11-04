#!/usr/bin/env node
/**
 * Seed GitHub labels for Agent Lab: priority:*, gate:*, level:*, status:*
 * Usage:
 *   GITHUB_TOKEN=xxxx REPO=owner/name node tools/seed_labels.js
 */
import fetch from 'node-fetch';

const token = process.env.GITHUB_TOKEN;
const repo = process.env.REPO; // e.g., "owner/repo"
if(!token || !repo){ console.error("Set GITHUB_TOKEN and REPO env vars"); process.exit(2); }

const [owner, name] = repo.split('/');
const api = `https://api.github.com/repos/${owner}/${name}/labels`;
const headers = { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github+json" };

const labels = [
  // stages
  {name:'stage:ready', color:'ededed', description:'Ready for pull'},
  {name:'stage:in-progress', color:'0366d6', description:'In progress'},
  {name:'stage:review', color:'fbca04', description:'In review (gates)'},
  {name:'stage:promotion-board', color:'5319e7', description:'Awaiting Promotion Board'},
  {name:'stage:deploy-watch', color:'0e8a16', description:'Deploy & watch window'},
  // priority
  {name:"priority:P0", color:"b60205", description:"Mandatory (safety/compliance/CEO OKR)"},
  {name:"priority:P1", color:"d93f0b", description:"High value, near-term ROI"},
  {name:"priority:P2", color:"0e8a16", description:"Opportunistic/experimental"},
  // gates
  {name:"gate:1", color:"1d76db", description:"Safety"},
  {name:"gate:2", color:"1d76db", description:"Performance"},
  {name:"gate:3", color:"1d76db", description:"Cost"},
  {name:"gate:4", color:"1d76db", description:"Auditability"},
  // levels
  {name:"level:L0", color:"5319e7", description:"Advisor"},
  {name:"level:L1", color:"5319e7", description:"Operator"},
  {name:"level:L2", color:"5319e7", description:"Executor"},
  {name:"level:L3", color:"5319e7", description:"Orchestrator"},
  // status
  {name:"status:pilot", color:"c5def5", description:"Pilot phase"},
  {name:"status:live", color:"a2eeef", description:"Live"},
  {name:"status:watch", color:"0052cc", description:"Post-promotion watch window"},
  {name:"status:rollback", color:"e99695", description:"Rolled back"}
];

async function upsert(label){
  const res = await fetch(`${api}/${encodeURIComponent(label.name)}`, { headers });
  if(res.status === 200){
    // update
    await fetch(`${api}/${encodeURIComponent(label.name)}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({color: label.color, description: label.description})
    });
    console.log(`Updated: ${label.name}`);
  } else if (res.status === 404){
    // create
    await fetch(api, {
      method: 'POST', headers,
      body: JSON.stringify(label)
    });
    console.log(`Created: ${label.name}`);
  } else {
    console.error(`Error fetching ${label.name}: ${res.status}`);
  }
}

for(const l of labels){ await upsert(l); }
console.log("Done.");
