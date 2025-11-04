async function fetchAgents(){
  try{
    const res = await fetch('/agents/summary', {cache:'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    return await res.json();
  }catch(e){
    console.warn('Falling back to local sample:', e.message);
    const res = await fetch('./agents.sample.json');
    return await res.json();
  }
}

function classForSuccess(v){ if(v>=0.8) return 'ok'; if(v>=0.7) return 'warn'; return 'bad'; }
function classForLatency(v){ if(v<=5.0) return 'ok'; if(v<=6.0) return 'warn'; return 'bad'; }
function classForCost(v){ if(v<=0.05) return 'ok'; if(v<=0.06) return 'warn'; return 'bad'; }

function render(list){
  const grid = document.getElementById('agentsGrid'); grid.innerHTML='';
  const counts = {L0:0,L1:0,L2:0,L3:0};
  list.forEach(a=>counts[a.autonomy_level]=(counts[a.autonomy_level]||0)+1);
  ['L0','L1','L2','L3'].forEach(l=>document.getElementById('count'+l).textContent = counts[l]||0);

  list.forEach(a=>{
    const level=a.autonomy_level||'L0';
    const succ=a.kpis?.task_success??0, lat=a.kpis?.latency_p95_s??0, cost=a.kpis?.cost_per_task_usd??0;
    const el=document.createElement('div'); el.className='agent';
    el.innerHTML=`
      <div>
        <h3>${a.display_name||a.name}</h3>
        <div class="badges">
          <span class="badge ${level.toLowerCase()}">${level}</span>
          <span class="badge">${a.status||'-'}</span>
          <span class="badge">Gate ${a.next_gate||'-'}</span>
        </div>
      </div>
      <div class="progress"><span style="width:${a.promotion_progress_pct||0}%"></span></div>
      <div class="kpis">
        <div class="kpi"><div class="v ${classForSuccess(succ)}">${(succ*100).toFixed(0)}%</div><div>Success</div></div>
        <div class="kpi"><div class="v ${classForLatency(lat)}">${lat.toFixed(1)}s</div><div>p95</div></div>
        <div class="kpi"><div class="v ${classForCost(cost)}">$${cost.toFixed(3)}</div><div>Cost</div></div>
      </div>
    `;
    grid.appendChild(el);
  });
}

function applyFilters(all){
  const level = document.getElementById('filterLevel').value;
  const status = document.getElementById('filterStatus').value;
  const q = document.getElementById('search').value.toLowerCase();
  const filtered = all.filter(a=> (!level || a.autonomy_level===level) && (!status || a.status===status) && (!q || (a.display_name||a.name).toLowerCase().includes(q)));
  render(filtered);
}

(async function init(){
  const DATA = await fetchAgents();
  document.getElementById('filterLevel').onchange = ()=>applyFilters(DATA);
  document.getElementById('filterStatus').onchange = ()=>applyFilters(DATA);
  document.getElementById('search').oninput = ()=>applyFilters(DATA);
  applyFilters(DATA);
})();