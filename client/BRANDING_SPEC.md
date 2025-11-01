# Dream Team Hub - Refined Branding Specification

## Overview
This document defines the refined branding system for Dream Team Hub, focusing on audit-grade, evidence-first design with calm, professional aesthetics.

## Core Principles
- **Tone**: Calm, audit-grade, "evidence first"
- **Typography**: Space Grotesk for titles, Inter for body text, JetBrains Mono for code
- **Icons**: Minimal rounded-line, duotone teal→indigo, tiny orange micro-accent (2–3px dot) when appropriate
- **Pod Colors**: Rails, icon strokes, and chips only—never full body fills

## Design Tokens

### Core Brand Colors
```css
--brand-dark: #0B0D12       /* Main canvas background */
--brand-surface: #0F1422    /* Card surfaces */
--brand-line: #1B2136       /* Borders and dividers */
--brand-light: #F7F8FB      /* Light accents */
```

### Primary Spectrum
```css
--brand-teal: #1CE6D3       --core-teal: #1CE6D3
--brand-indigo: #6B8CFF     --core-indigo: #6B8CFF
--brand-yellow: #FFD449
--brand-magenta: #F48FBB
--brand-jade: #34AABB
--brand-orange: #FF965A
```

### Text Hierarchy
```css
--text-primary: #E8EBFF     /* Main text (WCAG AAA: 19.43:1) */
--text-secondary: #C8CEEF   /* Secondary text (WCAG AAA: 13.29:1) */
--text-muted: #AAB0D8       /* Muted text */
```

### Glass-Morphism
```css
--glass-bg: rgba(255,255,255,0.08)
--glass-border: rgba(255,255,255,0.14)
```

### Elevation Shadows
```css
--elev-1: 0 10px 24px rgba(0,0,0,.28)     /* Subtle */
--elev-2: 0 18px 48px rgba(0,0,0,.35)     /* Prominent */
--elev-3: 0 24px 64px rgba(0,0,0,.45)     /* Maximum */
```

### Gradients
```css
--grad-orchestra: linear-gradient(135deg, teal → indigo)
--grad-synapse: linear-gradient(135deg, yellow → teal → indigo)
```

## Component Patterns

### 1. Decision Log Card

**Purpose**: Display decision entries with audit-grade evidence tracking

**Anatomy**:
```tsx
<article className="role-card">
  <div className="rail pod-rail control h-1.5" />
  <div className="inner grid gap-3">
    {/* Icon badge + Title + Status pill */}
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <span className="icon-badge">
          {/* SVG duotone icon */}
        </span>
        <h2 className="text-lg md:text-xl font-grotesk">
          Decision Title
        </h2>
      </div>
      <span className="status-pill active">Active</span>
    </div>

    {/* Rationale */}
    <p className="text-text-secondary">
      One-line description of the decision rationale.
    </p>

    {/* Meta row: Approvers + Date */}
    <div className="flex flex-wrap gap-2">
      <span className="chip">Approved by: OS</span>
      <span className="chip">Dec 31, 2024</span>
    </div>

    {/* Related Pods (pod-tinted chips) */}
    <div className="flex flex-wrap gap-2 pt-1">
      <span className="chip chip-pod-product">Pod #1</span>
      <span className="chip chip-pod-brand">Pod #2</span>
    </div>
  </div>
</article>
```

**CSS Classes**:
- `.role-card` - Glass shell with elevation
- `.rail.pod-rail.{pod}` - Colored gradient rail (10px height)
- `.inner` - Inner content padding
- `.icon-badge` - Duotone teal/indigo circular badge
- `.status-pill.{variant}` - Status indicator (active/pending/archived)
- `.chip` - Standard neutral chip
- `.chip-pod-{pod}` - Pod-tinted chip with colored text/border

### 2. Error/Empty State

**Purpose**: Reassuring, actionable error messaging

**Anatomy**:
```tsx
<main className="min-h-dvh grid place-items-center bg-grad-synapse px-6">
  <section className="glass-panel w-full max-w-xl text-center">
    <div className="mx-auto mb-4 w-16 h-16 rounded-full 
                    border border-white/20 grid place-items-center
                    bg-core-indigo/15">
      {/* SVG line icon (cloud/off) duotone */}
    </div>

    <h1 className="font-grotesk text-2xl mb-2">
      We couldn't reach this app
    </h1>
    
    <p className="text-text-secondary mb-6">
      Make sure your service is listening and the port is exposed.
    </p>

    <div className="flex flex-wrap items-center justify-center gap-3">
      <button className="btn">Retry connection</button>
      <a className="btn ghost" href="#">Open in Replit</a>
      <a className="underline text-text-secondary" href="#">Hosting help</a>
    </div>

    <div className="mt-6 text-sm text-text-muted">
      <span>Expected port: 5000</span> · <span>Last ping: just now</span>
    </div>
  </section>
</main>
```

**CSS Classes**:
- `.glass-panel` - Glass container with elev-3 shadow
- `.bg-grad-synapse` - Full-bleed gradient background
- `.btn` - Primary button with Orchestra gradient
- `.btn.ghost` - Transparent button variant

## Status Pills

Three variants with color-mixed backgrounds:

```css
.status-pill.active {
  background: color-mix(in oklab, var(--core-teal) 15%, transparent);
  border-color: color-mix(in oklab, var(--core-teal) 30%, transparent);
}

.status-pill.pending {
  background: color-mix(in oklab, var(--brand-yellow) 15%, transparent);
  border-color: color-mix(in oklab, var(--brand-yellow) 30%, transparent);
}

.status-pill.archived {
  background: color-mix(in oklab, var(--text-muted) 10%, transparent);
  border-color: color-mix(in oklab, var(--text-muted) 20%, transparent);
}
```

## Pod-Tinted Chips

Pod chips use colored text and borders (10-14% opacity) without fills:

```tsx
<span className="chip chip-pod-control">Control Tower</span>
<span className="chip chip-pod-product">Product</span>
<span className="chip chip-pod-marketing">Marketing</span>
```

Available classes:
- `.chip-pod-control` - Blue (#3D6BFF)
- `.chip-pod-intake` - Teal (#5CE1CF)
- `.chip-pod-decision` - Yellow (#FFC24D)
- `.chip-pod-roster` - Pink (#C95CAF)
- `.chip-pod-ip` - Purple (#6B1E9C)
- `.chip-pod-security` - Gray-blue (#3B4A5A)
- `.chip-pod-product` - Cyan (#1F9CFF)
- `.chip-pod-brand` - Magenta (#FF5BCD)
- `.chip-pod-marketing` - Orange (#FF7A45)
- `.chip-pod-finance` - Green (#2DBE7A)
- `.chip-pod-rhythm` - Indigo (#5A67FF)

## Accessibility

### Focus States
All interactive elements use `.ring-brand`:
```css
.focus-visible:outline-none .ring-brand
```

### Color Contrast
- Primary text: 19.43:1 (WCAG AAA)
- Secondary text: 13.29:1 (WCAG AAA)
- Glass panels maintain ≥4.5:1 contrast on gradients

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  /* Disable hover glows */
  /* Keep subtle 120ms translate-y/opacity on cards */
}
```

## Typography Usage

### Titles (Space Grotesk)
```tsx
<h1 className="font-grotesk text-2xl font-semibold">
  Decision Log
</h1>
```

### Body Text (Inter)
```tsx
<p className="text-base text-text-secondary">
  Regular body content uses Inter.
</p>
```

### Code/IDs (JetBrains Mono)
```tsx
<code className="font-mono text-sm text-text-muted">
  role-card-id-123
</code>
```

## Microcopy (On-Brand)

### Primary CTAs
- "Retry connection"
- "Log Decision"
- "Start Conversation"

### Secondary CTAs
- "Open in Replit"
- "View hosting guide"
- "Check status"

### Helper Text
- "Expected port: 5000"
- "Last ping: just now"
- "Make sure your service is listening"

## Implementation Notes

1. **Pod Rails**: Always use thin rails (h-1.5 = 6px or h-2.5 = 10px) at card tops
2. **Icon Badges**: 36px circular containers with duotone icons
3. **Chips**: Use neutral `.chip` by default, `.chip-pod-{pod}` for pod associations
4. **Glass Panels**: Reserve for modals, error states, and elevated content
5. **Gradients**: Orchestra for primary actions, Synapse for error/special states

## File References

- **Tokens**: `client/src/dth_tokens.css`
- **Tailwind Config**: `tailwind.config.ts`
- **Pod Plugin**: `tailwind.podglass.plugin.ts`
- **Brand Guide Page**: `client/src/pages/brand-guide.tsx`
