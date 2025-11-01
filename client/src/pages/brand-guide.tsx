import { Palette, Type, Box, Sparkles, Code } from "lucide-react";

export default function BrandGuidePage() {
  return (
    <div className="guide-body">
      {/* Hero Section */}
      <section className="container">
        <h1 style={{ font: '800 48px/1 Space Grotesk, Inter', margin: 0, background: 'var(--grad-orchestra)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }} data-testid="text-hero-title">
          Dream Team Hub — Branding Style Guide (v1)
        </h1>
        <p className="subtitle" style={{ marginTop: '10px', color: 'var(--text-secondary)' }} data-testid="text-hero-subtitle">
          Prism (Brand/Copy) + Lume (UX/Systems). This guide locks the look & feel — colors, gradients, typography, glass surfaces, buttons, and Role Card patterns — so we nail the overall brand before returning to iconography.
        </p>
      </section>

      {/* Typography, Core Palette, Glassmorphism */}
      <section className="container grid cols-3">
        {/* Typography */}
        <div className="card" data-testid="card-typography">
          <h3>Typography</h3>
          <p style={{ font: '800 28px/1.15 Space Grotesk, Inter' }}>Heading / Space Grotesk 800</p>
          <p style={{ font: '700 20px/1.2 Inter' }}>Subheading / Inter 700</p>
          <p style={{ font: '400 15px/1.7 Inter', color: 'var(--text-secondary)' }}>Body / Inter 400 — clean, modern, highly legible. Use 1.6–1.8 leading for paragraphs on dark surfaces.</p>
          <div className="token-row" data-testid="row-h1"><span>H1</span><code>48 / 56 / 800</code></div>
          <div className="token-row" data-testid="row-h2"><span>H2</span><code>32 / 40 / 700</code></div>
          <div className="token-row" data-testid="row-body"><span>Body</span><code>15 / 26 / 400</code></div>
        </div>

        {/* Core Palette */}
        <div className="card" data-testid="card-core-palette">
          <h3>Core Palette</h3>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            <div><div className="swatch" style={{ background: '#1CE6D3' }} data-testid="swatch-teal"></div><code>#1CE6D3</code><span>Teal</span></div>
            <div><div className="swatch" style={{ background: '#6B8CFF' }} data-testid="swatch-indigo"></div><code>#6B8CFF</code><span>Indigo</span></div>
            <div><div className="swatch" style={{ background: '#FFD449' }} data-testid="swatch-yellow"></div><code>#FFD449</code><span>Yellow</span></div>
            <div><div className="swatch" style={{ background: '#F48FBB' }} data-testid="swatch-magenta"></div><code>#F48FBB</code><span>Magenta</span></div>
            <div><div className="swatch" style={{ background: '#34AABB' }} data-testid="swatch-jade"></div><code>#34AABB</code><span>Jade</span></div>
            <div><div className="swatch" style={{ background: '#FF965A' }} data-testid="swatch-orange"></div><code>#FF965A</code><span>Orange (accent)</span></div>
          </div>
          <div className="token-row" data-testid="row-dark-bg"><span>Dark BG</span><code>#0B0D12</code></div>
          <div className="token-row" data-testid="row-surface"><span>Surface</span><code>#0F1422</code></div>
          <div className="token-row" data-testid="row-line"><span>Line</span><code>#1B2136</code></div>
        </div>

        {/* Glassmorphism */}
        <div className="card" data-testid="card-glassmorphism">
          <h3>Glassmorphism</h3>
          <p className="subtitle">Use for cards, toolbars, and role tiles.</p>
          <div className="role-card" style={{ maxWidth: '360px' }} data-testid="demo-role-card">
            <div className="rail" style={{ background: 'var(--grad-orchestra)' }}></div>
            <div className="inner">
              <p className="title">Glass Card</p>
              <p style={{ color: 'var(--text-secondary)' }}>bg: <code>--glass-bg</code>, border: <code>--glass-border</code>, shadow: <code>--elev-2</code>. Avoid heavy blurs; prefer contrast + subtle ring on focus.</p>
              <button className="btn sm" data-testid="button-primary">Primary</button>
              <button className="btn secondary sm" data-testid="button-secondary">Secondary</button>
              <button className="btn ghost sm" data-testid="button-ghost">Ghost</button>
            </div>
          </div>
        </div>
      </section>

      {/* Pod Palette */}
      <section className="container">
        <div className="card" data-testid="card-pod-palette">
          <h3>Pod Palette (locked)</h3>
          <p className="subtitle">Each Pod owns a hue. Use as accent rails, icon strokes, or micro-highlights on that Pod's Role Cards.</p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: '16px' }}>
            <div><div className="swatch pod-rail control" data-testid="swatch-pod-control"></div><small>Control Tower</small></div>
            <div><div className="swatch pod-rail intake" data-testid="swatch-pod-intake"></div><small>Intake & Routing</small></div>
            <div><div className="swatch pod-rail decision" data-testid="swatch-pod-decision"></div><small>Decision Log</small></div>
            <div><div className="swatch pod-rail roster" data-testid="swatch-pod-roster"></div><small>Roster & Roles</small></div>
            <div><div className="swatch pod-rail ip" data-testid="swatch-pod-ip"></div><small>IP & Patent</small></div>
            <div><div className="swatch pod-rail security" data-testid="swatch-pod-security"></div><small>Security</small></div>
            <div><div className="swatch pod-rail product" data-testid="swatch-pod-product"></div><small>Product</small></div>
            <div><div className="swatch pod-rail brand" data-testid="swatch-pod-brand"></div><small>Brand</small></div>
            <div><div className="swatch pod-rail marketing" data-testid="swatch-pod-marketing"></div><small>Marketing</small></div>
            <div><div className="swatch pod-rail finance" data-testid="swatch-pod-finance"></div><small>Finance</small></div>
          </div>
        </div>
      </section>

      {/* Role Card Pattern */}
      <section className="container">
        <div className="card" data-testid="card-role-pattern">
          <h3>Role Card Pattern</h3>
          <p className="subtitle">Apply Pod hue to the rail + icon capsule; keep body text in brand neutrals. Icons may add a small orange accent.</p>
          <div className="grid cols-3">
            <div className="role-card" data-testid="role-card-prism">
              <div className="rail pod-rail marketing"></div>
              <div className="inner">
                <p className="title" style={{ font: '800 22px/1 Inter' }}>Prism</p>
                <p className="subtitle">Chief Story Architect · Creative</p>
                <div className="chips">
                  <span className="chip">Marketing & Comms</span>
                  <span className="chip">CREATIVE</span>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>Shapes messaging and narrative frameworks across GTM strategies.</p>
              </div>
            </div>
            <div className="role-card" data-testid="role-card-aegis">
              <div className="rail pod-rail ip"></div>
              <div className="inner">
                <p className="title" style={{ font: '800 22px/1 Inter' }}>Aegis</p>
                <p className="subtitle">IP & Patent Counsel · Governance</p>
                <div className="chips">
                  <span className="chip">IP & Patent</span>
                  <span className="chip">GOVERNANCE</span>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>Owns claims/spec/figures, filings, and patentability/FTO strategy.</p>
              </div>
            </div>
            <div className="role-card" data-testid="role-card-spectra">
              <div className="rail pod-rail security"></div>
              <div className="inner">
                <p className="title" style={{ font: '800 22px/1 Inter' }}>Spectra</p>
                <p className="subtitle">Chief Trust & Protection · Governance</p>
                <div className="chips">
                  <span className="chip">Security</span>
                  <span className="chip">GOVERNANCE</span>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>Fosters trust with robust security systems and compliant practice.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Buttons, Elevation, Gradients */}
      <section className="container grid cols-3">
        {/* Buttons */}
        <div className="card" data-testid="card-buttons">
          <h3>Buttons</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn" data-testid="button-demo-primary"><span>Primary</span></button>
            <button className="btn secondary" data-testid="button-demo-secondary"><span>Secondary</span></button>
            <button className="btn ghost" data-testid="button-demo-ghost"><span>Ghost</span></button>
            <button className="btn sm" style={{ '--bg': 'linear-gradient(135deg,var(--pod-marketing),var(--brand-yellow))' } as React.CSSProperties} data-testid="button-marketing">Marketing</button>
            <button className="btn sm" style={{ '--bg': 'linear-gradient(135deg,var(--pod-ip),var(--brand-indigo))' } as React.CSSProperties} data-testid="button-ip">IP</button>
            <button className="btn sm" style={{ '--bg': 'linear-gradient(135deg,var(--pod-security),var(--brand-jade))' } as React.CSSProperties} data-testid="button-security">Security</button>
          </div>
        </div>

        {/* Elevation & Focus */}
        <div className="card" data-testid="card-elevation">
          <h3>Elevation & Focus</h3>
          <p className="subtitle">Keep shadows soft; use teal ring for keyboard focus.</p>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '160px', height: '100px', borderRadius: '16px', background: 'var(--brand-surface)', boxShadow: 'var(--elev-1)' }} data-testid="demo-elev-1"></div>
            <div style={{ width: '160px', height: '100px', borderRadius: '16px', background: 'var(--brand-surface)', boxShadow: 'var(--elev-2)' }} data-testid="demo-elev-2"></div>
          </div>
          <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>
            <span className="kbd">--elev-1</span> & <span className="kbd">--elev-2</span>
          </p>
        </div>

        {/* Gradients */}
        <div className="card" data-testid="card-gradients">
          <h3>Gradients</h3>
          <div className="swatch" style={{ height: '60px', background: 'var(--grad-orchestra)', marginBottom: '10px' }} data-testid="swatch-orchestra"></div>
          <div className="swatch" style={{ height: '60px', background: 'var(--grad-synapse)' }} data-testid="swatch-synapse"></div>
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Use Orchestra for hero rails & CTAs. Use Synapse sparingly for special banners.</p>
        </div>
      </section>

      {/* Implementation Tokens */}
      <section className="container">
        <div className="card" data-testid="card-tokens">
          <h3>Implementation Tokens</h3>
          <p className="subtitle">Drop these tokens into your CSS. If you're using Tailwind, mirror as CSS variables with a theme plugin.</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#0B0F1B', padding: '16px', borderRadius: '12px', border: '1px solid var(--brand-line)', color: '#CFE2FF' }} data-testid="code-tokens">
{`:root {
  /* Core brand */
  --brand-dark: #0B0D12;
  --brand-surface: #0F1422;
  --brand-line: #1B2136;
  --brand-light: #F7F8FB;

  /* Primary spectrum */
  --brand-teal: #1CE6D3;
  --brand-indigo: #6B8CFF;
  --brand-yellow: #FFD449;
  --brand-magenta: #F48FBB;
  --brand-jade: #34AABB;
  --brand-orange: #FF965A;

  /* Text */
  --text-primary: #E8EBFF;
  --text-secondary: #C8CEEF;
  --text-muted: #AAB0D8;

  /* Glass */
  --glass-bg: rgba(255,255,255,0.08);
  --glass-border: rgba(255,255,255,0.14);
  --glass-shadow: 0 18px 48px rgba(0,0,0,0.35);
  --ring: 0 0 0 3px rgba(28,230,211,0.35);

  /* Gradients */
  --grad-orchestra: linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-indigo) 100%);
  --grad-synapse: linear-gradient(135deg, var(--brand-yellow) 0%, var(--brand-teal) 60%, var(--brand-indigo) 100%);

  /* Pod hues (locked) */
  --pod-control: #3D6BFF;
  --pod-intake: #5CE1CF;
  --pod-decision: #FFC24D;
  --pod-roster: #C95CAF;
  --pod-ip: #6B1E9C;
  --pod-security: #3B4A5A;
  --pod-product: #1F9CFF;
  --pod-brand: #FF5BCD;
  --pod-marketing: #FF7A45;
  --pod-finance: #2DBE7A;
  --pod-rhythm: #5A67FF;

  /* Spacing scale (px) */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-7: 28px; --space-8: 32px;

  /* Radius */
  --radius-sm: 10px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 20px;

  /* Elevation */
  --elev-1: 0 10px 24px rgba(0,0,0,.28);
  --elev-2: 0 18px 48px rgba(0,0,0,.35);
}`}
          </pre>
        </div>
      </section>

      {/* Definition of Done */}
      <section className="container" style={{ paddingBottom: '40px' }}>
        <div className="card" data-testid="card-done">
          <h3>Definition of Done (Brand)</h3>
          <ul>
            <li>Pod colors are used only as accents (rails, icon strokes, chips, small highlights).</li>
            <li>Primary gradients drive CTAs and hero rails; limit loud gradients to small areas.</li>
            <li>Glass cards: <code>--glass-bg</code> + <code>--glass-border</code> + <code>--elev-2</code>. Avoid heavy blur.</li>
            <li>Typography: Space Grotesk for large headings only; Inter for everything else.</li>
            <li>Icons: minimal, rounded-line, subtle accent highlight — revisit after this guide is approved.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
