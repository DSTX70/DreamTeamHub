async function load(){
  const res = await fetch('agents.sample.json');
  const agents = await res.json();
  const counts = {L0:0,L1:0,L2:0,L3:0};
  agents.forEach(a=>counts[a.autonomy_level] = (counts[a.autonomy_level]||0)+1);
  document.getElementById('countL0').textContent = counts.L0||0;
  document.getElementById('countL1').textContent = counts.L1||0;
  document.getElementById('countL2').textContent = counts.L2||0;
  document.getElementById('countL3').textContent = counts.L3||0;

  const grid = document.getElementById('agentsGrid');
  agents.forEach(a=>{
    const el = document.createElement('div');
    el.className = 'agent';
    el.innerHTML = `
      <div>
        <h3>${a.display_name || a.name}</h3>
        <div class="badges">
          <span class="badge l${a.autonomy_level.slice(1)}">${a.autonomy_level}</span>
          <span class="badge">${a.status}</span>
          <span class="badge">Gate ${a.next_gate || '-'}</span>
        </div>
      </div>
      <div class="progress"><span style="width:${a.promotion_progress_pct||0}%"></span></div>
      <div class="kpis">
        <div class="kpi"><div class="v">${(a.kpis?.task_success*100||0).toFixed(0)}%</div><div>Success</div></div>
        <div class="kpi"><div class="v">${(a.kpis?.latency_p95_s||0).toFixed(1)}s</div><div>p95</div></div>
        <div class="kpi"><div class="v">$${(a.kpis?.cost_per_task_usd||0).toFixed(3)}</div><div>Cost</div></div>
      </div>
    `;
    grid.appendChild(el);
  });
}
load();
