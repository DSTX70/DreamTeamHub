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

  const applyPolicyKey = async (handle: string, key: string, suggestion: any) => {
    const base =
      specsByHandle[handle] || roleToSuggestedAgent(roles.find((r: any) => r.handle === handle)!);
    const updated: any = { ...base, policies: { ...(base.policies || {}), [key]: suggestion } };
    await upsertAgentSpec(updated);
  };

  const applyAllForHandle = async (handle: string, diffs: any[]) => {
    setLoading(true);
    try {
      const base =
        specsByHandle[handle] || roleToSuggestedAgent(roles.find((r: any) => r.handle === handle)!);
      const updated: any = { ...base };
      for (const d of diffs) {
        if (d.field === 'policies' && d.policyKeyDiffs?.length) {
          updated.policies = { ...(base.policies || {}) };
          for (const pk of d.policyKeyDiffs) {
            updated.policies[pk.key] = pk.suggestion;
          }
        } else if (typeof d.suggestion !== 'undefined') {
          updated[d.field] = d.suggestion;
        }
      }
      await upsertAgentSpec(updated);
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const fixAllDiffs = async () => {
    const targets = rows.filter((r) => hasSuggestions(r.diffs));
    if (!targets.length) {
      alert('No suggestions to apply.');
      return;
    }
    setLoading(true);
    setStatus('Applying all suggestions...');
    try {
      for (const row of targets) {
        const base = specsByHandle[row.role.handle] || roleToSuggestedAgent(row.role);
        const updated: any = { ...base };
        for (const d of row.diffs) {
          if (d.field === 'policies' && d.policyKeyDiffs?.length) {
            updated.policies = { ...(base.policies || {}) };
            for (const pk of d.policyKeyDiffs) {
              updated.policies[pk.key] = pk.suggestion;
            }
          } else if (typeof d.suggestion !== 'undefined') {
            updated[d.field] = d.suggestion;
          }
        }
        await upsertAgentSpec(updated);
      }
      setStatus('Applied suggestions for ' + targets.length + ' items.');
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section">
      <h2>Roles ↔ Agent Specs — Sync + Policy Key Diffs</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
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
                        {d.field === 'policies' && d.policyKeyDiffs?.length ? (
                          <ul style={{ marginTop: 6 }}>
                            {d.policyKeyDiffs.map((pk: any, pidx: number) => (
                              <li key={pidx}>
                                <code>{pk.key}</code>: baseline=<code>{formatValue(pk.roleValue)}</code> vs
                                agent=<code>{formatValue(pk.agentValue)}</code>
                                <button
                                  className="btn btn--secondary btn--sm"
                                  style={{ marginLeft: 8 }}
                                  onClick={() => applyPolicyKey(role.handle, pk.key, pk.suggestion)}
                                  data-testid={`button-apply-policy-${role.handle}-${pk.key}`}
                                >
                                  Apply key
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {typeof d.suggestion !== 'undefined' && d.field !== 'policies' ? (
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
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn--sm"
                      data-pod="brand"
                      onClick={() => applyAllForHandle(role.handle, diffs)}
                      data-testid={`button-apply-all-${role.handle}`}
                    >
                      Apply all suggestions for {role.handle}
                    </button>
                  </div>
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
