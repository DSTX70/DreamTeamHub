function qs(key){ return new URLSearchParams(location.search).get(key) || ''; }
function buildICS(title, startIso, durationMin=30){
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationMin*60000);
  function fmt(d){ return d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z'; }
  const uid = Math.random().toString(36).slice(2) + '@agent-lab';
  const lines = [
    'BEGIN:VCALENDAR','PRODID:-//Agent Lab//Calendar Viewer//EN','VERSION:2.0','CALSCALE:GREGORIAN','METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:'+uid,'DTSTAMP:'+fmt(new Date()),'DTSTART:'+fmt(start),'DTEND:'+fmt(end),
    'SUMMARY:'+title,
    'DESCRIPTION:Agent Lab Promotion Review',
    'END:VEVENT','END:VCALENDAR'
  ];
  return lines.join('\r\n');
}
async function copyToClipboard(text){
  try{ await navigator.clipboard.writeText(text); alert('Copied!'); }
  catch{ const t=document.createElement('textarea'); t.value=text; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); alert('Copied!'); }
}
function update(){
  const agent = qs('agent') || 'unknown-agent';
  const when = qs('when');
  const provider = qs('provider') || '';
  const redirect = qs('redirect') === '1';
  const pr = qs('pr') || '';

  document.getElementById('agent').textContent = agent;
  document.getElementById('when').textContent = when || '—';
  const prInput = document.getElementById('prurl');
  prInput.value = pr || '';
  document.getElementById('copyBtn').onclick = ()=> prInput.value && copyToClipboard(prInput.value);

  if (when){
    const dt = new Date(when);
    if(!isNaN(dt.getTime())){
      document.getElementById('local').textContent = dt.toString();
      const ics = buildICS(`Promotion Board — ${agent}`, when);
      const blob = new Blob([ics], {type:'text/calendar'});
      const url = URL.createObjectURL(blob);
      const a = document.getElementById('ics');
      a.href = url; a.download = `promotion_${agent}_${when.replace(/[:]/g,'-')}.ics`;
    }
  }

  const prov = document.getElementById('provider');
  if (provider){
    const url = provider + (provider.includes('?')?'&':'?') + 'agent=' + encodeURIComponent(agent) + '&when=' + encodeURIComponent(when) + (pr?('&pr='+encodeURIComponent(pr)):'');
    prov.href = url;
    if (redirect && when) location.replace(url);
  } else {
    prov.style.display = 'none';
  }
}
update();
