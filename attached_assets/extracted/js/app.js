(function(){
  const API = window.API_BASE || 'http://localhost:8000';

  const fallback = [
    { handle:"OS", title:"Orchestrator", pod:"control", podLabel:"Control Tower", roleLabel:"Lead",
      oneLiner:"Coordinate pods, priorities, mirrors, and escalations.",
      purpose:"Coordinate pods, priorities, mirrors, and escalations.",
      core:["Top-5 priorities","Escalation chase","Operating rhythm"],
      dod:["Owner+Due+Milestone+Next present","Artifacts linked","External-ready files attached"]
    },
    { handle:"Prism", title:"Marketing Lead", pod:"marketing", podLabel:"Marketing & Comms", roleLabel:"Lead",
      oneLiner:"Plan and execute GTM; own budgets, channel mix, and KPI lift.",
      purpose:"Plan and execute GTM; own budgets, channel mix, and KPI lift.",
      core:["Campaign briefs","Budget & KPIs","PR/Influencer"],
      dod:["Offer/Audience/Channels/KPIs locked","Approvals captured","Results summarized"]
    },
    { handle:"Aegis", title:"IP & Patent Counsel", pod:"ip", podLabel:"IP & Patent Program", roleLabel:"Counsel",
      oneLiner:"Translates invention into claims, figures, filings & risk memos.",
      purpose:"Own claims/spec/figures, filings, and patentability/FTO strategy.",
      core:["Claims drafting","FTO/patentability","Attorney packets"],
      dod:["Filed docs with confirmations","Docketed deadlines","Risk memo + mitigation plan"]
    },
    { handle:"Sentinel", title:"Security & Risk Lead", pod:"security", podLabel:"Security & Compliance", roleLabel:"Lead",
      oneLiner:"Prevent first, respond fast; SOC2/ISO and incident readiness.",
      purpose:"Threat modeling, incident playbooks, and compliance posture.",
      core:["Threat modeling","Incident readiness","Compliance"],
      dod:["Checklist passed","Playbooks documented","Risks mitigated/owned"]
    },
    { handle:"Nova", title:"Art Director", pod:"brand", podLabel:"Brand & Assets", roleLabel:"Art Director",
      oneLiner:"Turns strategy into brand-locked, production-ready assets.",
      purpose:"Own visual system, gradient language, iconography, and export specs.",
      core:["Asset production","Template governance","Spec checks"],
      dod:["Assets match brand-lock","Specs validated","Versioned packages delivered"]
    }
  ];

  const grid = document.getElementById('grid');
  const tabs = document.getElementById('tabs');
  const reloadBtn = document.getElementById('reloadBtn');
  const demoBtn = document.getElementById('demoBtn');
  const showAllBtn = document.getElementById('showAll');
  const collapseAllBtn = document.getElementById('collapseAll');

  let members = [];

  function fromRolesApi(items){
    // Map /roles payload to our UI shape
    return items.map(r => {
      const pod = (r.pod || '').toLowerCase()
        .replaceAll('&','and').replaceAll(' ','-')
        .replace('marketing-and-comms','marketing')
        .replace('ip-and-patent-program','ip')
        .replace('security-and-compliance','security')
        .replace('brand-and-assets','brand')
        .replace('finance-and-bizops','finance')
        .replace('product-and-engineering','product');
      const oneLiner = r.purpose || '';
      return {
        handle: r.handle || '',
        title: r.title || '',
        pod, podLabel: r.pod || '', roleLabel: 'Role',
        oneLiner: oneLiner.length>130 ? oneLiner.slice(0,127).replace(/\s\S*$/,'') + '…' : oneLiner,
        purpose: r.purpose || '',
        core: r.core_functions || [],
        dod: r.definition_of_done || []
      };
    });
  }

  async function loadFromApi(){
    try {
      const r = await fetch(`${API}/roles`);
      if(!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      members = fromRolesApi(data || []);
      if(!members.length) throw new Error('Empty roles');
      buildTabs();
      render('all');
      return true;
    } catch(e){
      console.warn('[roles] falling back:', e.message);
      members = fallback;
      buildTabs();
      render('all');
      return false;
    }
  }

  function card(m){
    const podClass = 'pod-' + m.pod;
    return `
      <div class="card ${podClass}" data-pod="${m.pod}">
        <div class="rail"></div>
        <div class="inner">
          <div class="icon">✨</div>
          <div class="title">${m.handle} — ${m.title}</div>
          <div class="chips">
            <span class="chip">${m.podLabel || ''}</span>
            <span class="chip">${m.roleLabel || 'Role'}</span>
          </div>
          <p class="oneliner">${m.oneLiner || ''}</p>
          <button class="btn btn--secondary btn--sm" onclick="toggleExpand(this)">View Full Profile</button>
          <div class="expand">
            <h4>Purpose</h4>
            <p>${m.purpose || ''}</p>
            ${m.core?.length ? `<h4>Core Functions</h4><div class="tags">${m.core.map(x=>`<span class="tag">${x}</span>`).join('')}</div>`:''}
            ${m.dod?.length ? `<h4>Definition of Done</h4><ul>${m.dod.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}
          </div>
        </div>
      </div>
    `;
  }
  window.toggleExpand = function(btn){
    const panel = btn.parentElement.querySelector('.expand');
    const open = panel.style.display==='block';
    panel.style.display = open ? 'none' : 'block';
    btn.textContent = open ? 'View Full Profile' : 'Hide Full Profile';
  };

  function buildTabs(){
    const pods = Array.from(new Set(members.map(m=>m.pod))).sort();
    tabs.innerHTML = ['<div class="tab active" data-filter="all">All Pods</div>']
      .concat(pods.map(p=>`<div class="tab" data-filter="${p}">${labelForPod(p)}</div>`))
      .join('');
    tabs.onclick = (e)=>{
      const t = e.target.closest('.tab'); if(!t) return;
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active'); render(t.dataset.filter);
    };
  }
  function labelForPod(p){
    const map = {
      marketing:"Marketing & Comms", ip:"IP & Patent Program", product:"Product & Engineering",
      security:"Security & Compliance", brand:"Brand & Assets", finance:"Finance & BizOps",
      control:"Control Tower", intake:"Intake & Routing", decision:"Decision Log",
      roster:"Roster & Roles", rhythm:"Operating Rhythm"
    };
    return map[p] || p;
  }
  function render(filter='all'){
    const items = filter==='all' ? members : members.filter(m=>m.pod===filter);
    grid.innerHTML = items.map(card).join('');
  }

  showAllBtn.onclick = ()=>{
    document.querySelectorAll('.expand').forEach(p=>p.style.display='block');
    document.querySelectorAll('.btn.btn--secondary.btn--sm').forEach(b=>b.textContent='Hide Full Profile');
  };
  collapseAllBtn.onclick = ()=>{
    document.querySelectorAll('.expand').forEach(p=>p.style.display='none');
    document.querySelectorAll('.btn.btn--secondary.btn--sm').forEach(b=>b.textContent='View Full Profile');
  };
  reloadBtn.onclick = loadFromApi;
  demoBtn.onclick = ()=>{ members = fallback; buildTabs(); render('all'); };

  // First load
  loadFromApi();
})();