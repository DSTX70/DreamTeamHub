import { useEffect, useMemo, useState } from 'react';
import { listRoles, listAgentSpecs, upsertAgentSpec } from '@/lib/admin_ex';
import { diffRoleAgent, roleToSuggestedAgent } from '@/lib/diff';

export default function RoleAgentSync() {
  const [roles, setRoles] = useState<any[]>([]);
  const [specs, setSpecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const [rs, as] = await Promise.all([listRoles(), listAgentSpecs()]);
      setRoles(rs || []);
      setSpecs(as || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const specsByHandle = useMemo(() => {
    const m: any = {};
    for (const s of specs) {
      m[s.handle] = s;
    }
    return m;
  }, [specs]);

  const unmapped = useMemo(
    () => roles.filter((r: any) => !specsByHandle[r.handle]),
    [roles, specsByHandle]
  );

  const bulkGenerate = async () => {
    if (!unmapped.length) {
      alert('No missing Agent Specs.');
      return;
    }
    setLoading(true);
    setStatus('Generating specs...');
    try {
      for (const r of unmapped) {
        await upsertAgentSpec(roleToSuggestedAgent(r));
      }
      setStatus('Generated ' + unmapped.length + ' specs.');
      await refresh();
    } catch (e: any) {
      alert('Error generating specs: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(
    () =>
      roles.map((r) => ({
        role: r,
        spec: specsByHandle[r.handle],
        diffs: diffRoleAgent(r, specsByHandle[r.handle]),
      })),
    [roles, specsByHandle]
  );

  const hasSuggestions = (diffs: any[]) => diffs.some((d) => typeof d.suggestion !== 'undefined');

  const applySuggestion = async (handle: string, field: string, suggestion: any) => {
    const base =
      specsByHandle[handle] || roleToSuggestedAgent(roles.find((r: any) => r.handle === handle)!);
    const updated: any = { ...base, [field]: suggestion };
    await upsertAgentSpec(updated);
  };

  const applyAllForHandle = async (handle: string, diffs: any[]) => {
    setLoading(true);
    try {
      const base =
        specsByHandle[handle] || roleToSuggestedAgent(roles.find((r: any) => r.handle === handle)!);
      const updated: any = { ...base };
      for (const d of diffs) {
        if (typeof d.suggestion !== 'undefined') {
          updated[d.field] = d.suggestion;
        }
      }
      await upsertAgentSpec(updated);
      await refresh();
    } catch (e: any) {
      alert('Apply all failed: ' + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  };

  const fixAllDiffs = async () => {
    const allWithSuggestions = rows.filter((row) => hasSuggestions(row.diffs));
    if (!allWithSuggestions.length) {
      alert('No suggestions to apply.');
      return;
    }
    setLoading(true);
    setStatus('Applying all suggestions...');
    try {
      for (const row of allWithSuggestions) {
        const base = specsByHandle[row.role.handle] || roleToSuggestedAgent(row.role);
        const updated: any = { ...base };
        for (const d of row.diffs) {
          if (typeof d.suggestion !== 'undefined') {
            updated[d.field] = d.suggestion;
          }
        }
        await upsertAgentSpec(updated);
      }
      setStatus('Applied suggestions for ' + allWithSuggestions.length + ' items.');
      await refresh();
    } catch (e: any) {
      alert('Fix all failed: ' + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section">
      <h2>Roles ↔ Agent Specs — Bulk Map & Sync</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className="btn"
          data-pod="product"
          onClick={bulkGenerate}
          disabled={loading}
          data-testid="button-generate-missing-specs"
        >
          {loading ? 'Working…' : `Generate Missing Specs (${unmapped.length})`}
        </button>
        <button
          className="btn btn--secondary"
          onClick={fixAllDiffs}
          disabled={loading}
          data-testid="button-fix-all-diffs"
        >
          Fix all diffs
        </button>
        <button
          className="btn btn--secondary"
          onClick={refresh}
          disabled={loading}
          data-testid="button-refresh-sync"
        >
          Refresh
        </button>
        {status ? <span className="chip" data-testid="text-status">{status}</span> : null}
      </div>

      <h3 style={{ marginTop: 16 }}>Diffs (by handle)</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        {rows.map(({ role, spec, diffs }, i) => (
          <div key={role.handle + i} className="card" data-testid={`card-diff-${role.handle}`}>
            <div className="rail" />
            <div className="inner">
              <div className="title">{role.handle} — {role.title}</div>
              {diffs.length === 0 ? (
                <p className="oneliner" data-testid={`text-sync-status-${role.handle}`}>
                  No diffs — in sync ✅
                </p>
              ) : (
                <>
                  <ul style={{ margin: '8px 0 0 18px' }}>
                    {diffs.map((d: any, idx: number) => (
                      <li key={idx} style={{ marginBottom: 6 }}>
                        <b>{d.field}</b>: role=<code>{formatValue(d.roleValue)}</code> vs agent=
                        <code>{formatValue(d.agentValue)}</code>
                        {typeof d.suggestion !== 'undefined' ? (
                          <button
                            className="btn btn--secondary btn--sm"
                            style={{ marginLeft: 8 }}
                            onClick={() => applySuggestion(role.handle, d.field, d.suggestion)}
                            data-testid={`button-apply-${role.handle}-${d.field}`}
                          >
                            Apply suggestion
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {hasSuggestions(diffs) ? (
                    <div style={{ marginTop: 10 }}>
                      <button
                        className="btn btn--sm"
                        data-pod="brand"
                        onClick={() => applyAllForHandle(role.handle, diffs)}
                        data-testid={`button-apply-all-${role.handle}`}
                      >
                        Apply all suggestions for {role.handle}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatValue(v: any) {
  if (Array.isArray(v)) return v.join(' | ');
  if (typeof v === 'object' && v !== null) return JSON.stringify(v);
  return String(v ?? '');
}
