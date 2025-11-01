import { Palette, Type, Box, Sparkles, Code } from "lucide-react";

export default function BrandGuidePage() {
  return (
    <div className="min-h-screen bg-brand-dark pb-12">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-8 max-w-7xl">
        <h1 className="font-grotesk text-6xl font-extrabold bg-grad-orchestra bg-clip-text text-transparent mb-4" data-testid="text-hero-title">
          Dream Team Hub — Brand Guide v1
        </h1>
        <p className="text-text-secondary text-lg max-w-4xl" data-testid="text-hero-subtitle">
          Prism (Brand/Copy) + Lume (UX/Systems). This guide locks the look & feel — colors, gradients, typography, glass surfaces, buttons, and Role Card patterns — so we nail the overall brand before returning to iconography.
        </p>
      </section>

      {/* Typography, Core Palette, Glassmorphism */}
      <section className="container mx-auto px-6 max-w-7xl">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Typography */}
          <div className="card" data-testid="card-typography">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Type className="w-5 h-5" />
              Typography
            </h3>
            <p className="font-grotesk text-3xl font-extrabold mb-2">Heading / Space Grotesk 800</p>
            <p className="font-inter text-xl font-bold mb-2">Subheading / Inter 700</p>
            <p className="font-inter text-text-secondary leading-relaxed mb-4">
              Body / Inter 400 — clean, modern, highly legible. Use 1.6–1.8 leading for paragraphs on dark surfaces.
            </p>
            <div className="token-row" data-testid="row-h1"><span>H1</span><code className="text-text-secondary">48 / 56 / 800</code></div>
            <div className="token-row" data-testid="row-h2"><span>H2</span><code className="text-text-secondary">32 / 40 / 700</code></div>
            <div className="token-row border-b-0" data-testid="row-body"><span>Body</span><code className="text-text-secondary">15 / 26 / 400</code></div>
          </div>

          {/* Core Palette */}
          <div className="card" data-testid="card-core-palette">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Core Palette
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <div className="swatch" style={{ background: '#1CE6D3' }} data-testid="swatch-teal"></div>
                <code className="text-xs text-text-secondary">#1CE6D3</code>
                <p className="text-xs text-text-muted">Teal</p>
              </div>
              <div>
                <div className="swatch" style={{ background: '#6B8CFF' }} data-testid="swatch-indigo"></div>
                <code className="text-xs text-text-secondary">#6B8CFF</code>
                <p className="text-xs text-text-muted">Indigo</p>
              </div>
              <div>
                <div className="swatch" style={{ background: '#FFD449' }} data-testid="swatch-yellow"></div>
                <code className="text-xs text-text-secondary">#FFD449</code>
                <p className="text-xs text-text-muted">Yellow</p>
              </div>
              <div>
                <div className="swatch" style={{ background: '#F48FBB' }} data-testid="swatch-magenta"></div>
                <code className="text-xs text-text-secondary">#F48FBB</code>
                <p className="text-xs text-text-muted">Magenta</p>
              </div>
              <div>
                <div className="swatch" style={{ background: '#34AABB' }} data-testid="swatch-jade"></div>
                <code className="text-xs text-text-secondary">#34AABB</code>
                <p className="text-xs text-text-muted">Jade</p>
              </div>
              <div>
                <div className="swatch" style={{ background: '#FF965A' }} data-testid="swatch-orange"></div>
                <code className="text-xs text-text-secondary">#FF965A</code>
                <p className="text-xs text-text-muted">Orange</p>
              </div>
            </div>
            <div className="token-row" data-testid="row-dark-bg"><span>Dark BG</span><code className="text-text-secondary">#0B0D12</code></div>
            <div className="token-row" data-testid="row-surface"><span>Surface</span><code className="text-text-secondary">#0F1422</code></div>
            <div className="token-row border-b-0" data-testid="row-line"><span>Line</span><code className="text-text-secondary">#1B2136</code></div>
          </div>

          {/* Glassmorphism */}
          <div className="card" data-testid="card-glassmorphism">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Box className="w-5 h-5" />
              Glassmorphism
            </h3>
            <p className="text-text-secondary text-sm mb-4">Use for cards, toolbars, and role tiles.</p>
            <div className="role-card max-w-sm" data-testid="demo-role-card">
              <div className="rail bg-grad-orchestra"></div>
              <div className="inner">
                <p className="title text-xl">Glass Card</p>
                <p className="text-text-secondary text-sm mb-3">
                  bg: <code>--glass-bg</code>, border: <code>--glass-border</code>, shadow: <code>--elev-2</code>. Avoid heavy blurs; prefer contrast + subtle ring on focus.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn sm" data-testid="button-primary">Primary</button>
                  <button className="btn secondary sm" data-testid="button-secondary">Secondary</button>
                  <button className="btn ghost sm" data-testid="button-ghost">Ghost</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pod Palette */}
      <section className="container mx-auto px-6 max-w-7xl mt-8">
        <div className="card" data-testid="card-pod-palette">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Pod Palette (locked)
          </h3>
          <p className="text-text-secondary mb-4">Each Pod owns a hue. Use as accent rails, icon strokes, or micro-highlights on that Pod's Role Cards.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            <div>
              <div className="swatch pod-rail-control h-14" data-testid="swatch-pod-control"></div>
              <small className="text-text-muted">Control Tower</small>
            </div>
            <div>
              <div className="swatch pod-rail-intake h-14" data-testid="swatch-pod-intake"></div>
              <small className="text-text-muted">Intake & Routing</small>
            </div>
            <div>
              <div className="swatch pod-rail-decision h-14" data-testid="swatch-pod-decision"></div>
              <small className="text-text-muted">Decision Log</small>
            </div>
            <div>
              <div className="swatch pod-rail-roster h-14" data-testid="swatch-pod-roster"></div>
              <small className="text-text-muted">Roster & Roles</small>
            </div>
            <div>
              <div className="swatch pod-rail-ip h-14" data-testid="swatch-pod-ip"></div>
              <small className="text-text-muted">IP & Patent</small>
            </div>
            <div>
              <div className="swatch pod-rail-security h-14" data-testid="swatch-pod-security"></div>
              <small className="text-text-muted">Security</small>
            </div>
            <div>
              <div className="swatch pod-rail-product h-14" data-testid="swatch-pod-product"></div>
              <small className="text-text-muted">Product</small>
            </div>
            <div>
              <div className="swatch pod-rail-brand h-14" data-testid="swatch-pod-brand"></div>
              <small className="text-text-muted">Brand</small>
            </div>
            <div>
              <div className="swatch pod-rail-marketing h-14" data-testid="swatch-pod-marketing"></div>
              <small className="text-text-muted">Marketing</small>
            </div>
            <div>
              <div className="swatch pod-rail-finance h-14" data-testid="swatch-pod-finance"></div>
              <small className="text-text-muted">Finance</small>
            </div>
            <div>
              <div className="swatch pod-rail-rhythm h-14" data-testid="swatch-pod-rhythm"></div>
              <small className="text-text-muted">Operating Rhythm</small>
            </div>
          </div>
        </div>
      </section>

      {/* Role Card Pattern */}
      <section className="container mx-auto px-6 max-w-7xl mt-8">
        <div className="card" data-testid="card-role-pattern">
          <h3 className="text-xl font-bold mb-2">Role Card Pattern</h3>
          <p className="text-text-secondary mb-4">Apply Pod hue to the rail + icon capsule; keep body text in brand neutrals. Icons may add a small orange accent.</p>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="role-card" data-testid="role-card-prism">
              <div className="rail pod-rail-marketing"></div>
              <div className="inner">
                <p className="title text-2xl">Prism</p>
                <p className="subtitle">Chief Story Architect · Creative</p>
                <div className="chips">
                  <span className="chip">Marketing & Comms</span>
                  <span className="chip">CREATIVE</span>
                </div>
                <p className="text-text-secondary">Shapes messaging and narrative frameworks across GTM strategies.</p>
              </div>
            </div>
            <div className="role-card" data-testid="role-card-aegis">
              <div className="rail pod-rail-ip"></div>
              <div className="inner">
                <p className="title text-2xl">Aegis</p>
                <p className="subtitle">IP & Patent Counsel · Governance</p>
                <div className="chips">
                  <span className="chip">IP & Patent</span>
                  <span className="chip">GOVERNANCE</span>
                </div>
                <p className="text-text-secondary">Owns claims/spec/figures, filings, and patentability/FTO strategy.</p>
              </div>
            </div>
            <div className="role-card" data-testid="role-card-spectra">
              <div className="rail pod-rail-security"></div>
              <div className="inner">
                <p className="title text-2xl">Spectra</p>
                <p className="subtitle">Chief Trust & Protection · Governance</p>
                <div className="chips">
                  <span className="chip">Security</span>
                  <span className="chip">GOVERNANCE</span>
                </div>
                <p className="text-text-secondary">Fosters trust with robust security systems and compliant practice.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Buttons, Elevation, Gradients */}
      <section className="container mx-auto px-6 max-w-7xl mt-8">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Buttons */}
          <div className="card" data-testid="card-buttons">
            <h3 className="text-xl font-bold mb-4">Buttons</h3>
            <div className="flex gap-3 flex-wrap">
              <button className="btn" data-testid="button-demo-primary"><span>Primary</span></button>
              <button className="btn secondary" data-testid="button-demo-secondary"><span>Secondary</span></button>
              <button className="btn ghost" data-testid="button-demo-ghost"><span>Ghost</span></button>
            </div>
            <div className="flex gap-2 flex-wrap mt-3">
              <button className="btn sm" style={{ background: 'linear-gradient(135deg, var(--pod-marketing), var(--brand-yellow))' }} data-testid="button-marketing">Marketing</button>
              <button className="btn sm" style={{ background: 'linear-gradient(135deg, var(--pod-ip), var(--brand-indigo))' }} data-testid="button-ip">IP</button>
              <button className="btn sm" style={{ background: 'linear-gradient(135deg, var(--pod-security), var(--brand-jade))' }} data-testid="button-security">Security</button>
            </div>
          </div>

          {/* Elevation & Focus */}
          <div className="card" data-testid="card-elevation">
            <h3 className="text-xl font-bold mb-4">Elevation & Focus</h3>
            <p className="text-text-secondary text-sm mb-4">Keep shadows soft; use teal ring for keyboard focus.</p>
            <div className="flex gap-4 items-center">
              <div className="w-40 h-24 rounded-xl bg-brand-surface shadow-elev-1" data-testid="demo-elev-1"></div>
              <div className="w-40 h-24 rounded-xl bg-brand-surface shadow-elev-2" data-testid="demo-elev-2"></div>
            </div>
            <p className="mt-3 text-text-muted">
              <span className="kbd">--elev-1</span> & <span className="kbd">--elev-2</span>
            </p>
          </div>

          {/* Gradients */}
          <div className="card" data-testid="card-gradients">
            <h3 className="text-xl font-bold mb-4">Gradients</h3>
            <div className="swatch h-16 bg-grad-orchestra mb-3" data-testid="swatch-orchestra"></div>
            <div className="swatch h-16 bg-grad-synapse mb-3" data-testid="swatch-synapse"></div>
            <p className="text-text-secondary text-sm">Use Orchestra for hero rails & CTAs. Use Synapse sparingly for special banners.</p>
          </div>
        </div>
      </section>

      {/* Implementation Tokens */}
      <section className="container mx-auto px-6 max-w-7xl mt-8">
        <div className="card" data-testid="card-tokens">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Implementation Tokens
          </h3>
          <p className="text-text-secondary mb-4">Drop these tokens into your CSS. If you're using Tailwind, mirror as CSS variables with a theme plugin.</p>
          <pre className="whitespace-pre-wrap bg-[#0B0F1B] p-4 rounded-xl border border-brand-line text-[#CFE2FF] text-sm overflow-x-auto" data-testid="code-tokens">
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
}`}
          </pre>
        </div>
      </section>

      {/* Definition of Done */}
      <section className="container mx-auto px-6 max-w-7xl mt-8 mb-8">
        <div className="card" data-testid="card-done">
          <h3 className="text-xl font-bold mb-4">Definition of Done (Brand)</h3>
          <ul className="space-y-2 text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-brand-teal mt-1">✓</span>
              <span>Pod colors are used only as accents (rails, icon strokes, chips, small highlights).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-teal mt-1">✓</span>
              <span>Primary gradients drive CTAs and hero rails; limit loud gradients to small areas.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-teal mt-1">✓</span>
              <span>Glass cards: <code>--glass-bg</code> + <code>--glass-border</code> + <code>--elev-2</code>. Avoid heavy blur.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-teal mt-1">✓</span>
              <span>Typography: Space Grotesk for large headings only; Inter for everything else.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-teal mt-1">✓</span>
              <span>Icons: minimal, rounded-line, subtle accent highlight — revisit after this guide is approved.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
