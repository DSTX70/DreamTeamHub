# Dream Team Hub - Refined Branding Specification

## Overview
This document defines the refined branding system for Dream Team Hub, focusing on audit-grade, evidence-first design with calm, professional aesthetics.

## Core Principles
- **Tone**: Calm, audit-grade, "evidence first"
- **Typography**: Space Grotesk for titles, Inter for body text, JetBrains Mono for code
- **Icons**: Minimal rounded-line, duotone teal→indigo, tiny orange micro-accent (2–3px dot) when appropriate
- **Pod Colors**: Rails (solid bars), chips (subtle tints), accents (full-color for selected states), and borders

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

## Pod Colors System (21 Pods)

The platform uses a comprehensive 21-pod color system for visual coding and organizational clarity. Pod colors appear as:
- **Rails**: Solid colored strips on card edges (`.pod-rail`)
- **Chips**: Tinted badges with colored backgrounds and borders (`.pod-chip`)
- **Accents**: Full-color backgrounds with white text (`.pod-accent`)
- **Borders**: Pod-colored borders (`.pod-border`)
- **Filter Buttons**: Pod-specific colored buttons with `data-pod` attributes

### Pod Color Palette

The system defines CSS variables for all 21 pods. Colors are activated via `data-pod` attributes:

| Pod Name | Hex Code | CSS Variable |
|----------|----------|--------------|
| Retail Collective Pod (RCP) | #2EC5C2 | `--pod-retail-collective-pod-rcp` |
| Social & Influence CoE (SICoE) | #6F5AE8 | `--pod-social-and-influence-coe-sicoe` |
| Creative Pod | #C95CAF | `--pod-creative-pod` |
| Product & Platform Pod | #0FA3B1 | `--pod-product-and-platform-pod` |
| IP/Patent Program Pod | #FF7A1A | `--pod-ip-patent-program-pod` |
| Security & Compliance Pod | #E4572E | `--pod-security-and-compliance-pod` |
| Marketing & PR Pod | #FFD449 | `--pod-marketing-and-pr-pod` |
| Ops & Finance Pod | #1A1A1A | `--pod-ops-and-finance-pod` |
| Cultural Pod | #34AABB | `--pod-cultural-pod` |
| Impact Programs Office (IPO) | #E24F8A | `--pod-impact-programs-office-ipo` |
| Education & Cohorts Pod | #5CB85C | `--pod-education-and-cohorts-pod` |
| Accessibility & Captioning Pod | #007ACC | `--pod-accessibility-and-captioning-pod` |
| Packaging & Pre-Press Pod | #D4AF37 | `--pod-packaging-and-pre-press-pod` |
| WMS / 3PL Ops Pod | #7A6FF0 | `--pod-wms---3pl-ops-pod` |
| Channel Integrations Pod | #50C3B8 | `--pod-channel-integrations-pod` |
| Author Platform Studio | #8C2E3F | `--pod-author-platform-studio` |
| Music Rights & Distribution Pod | #6B1E9C | `--pod-music-rights-and-distribution-pod` |
| Agent Governance Pod | #FF9B28 | `--pod-agent-governance-pod` |
| Tenant & Billing Pod | #2E86DE | `--pod-tenant-and-billing-pod` |
| GlobalCollabs Partnerships Pod | #F45B69 | `--pod-globalcollabs-partnerships-pod` |
| Data Stewardship & Metrics Pod | #2F9E44 | `--pod-data-stewardship-and-metrics-pod` |

### Usage Examples

**Pod Rails** (solid colored bars):
```tsx
<article className="role-card" data-pod="Creative Pod">
  <div className="pod-rail" />
  {/* Card content */}
</article>
```

**Pod Chips** (tinted badges with subtle backgrounds):
```tsx
<span className="pod-chip" data-pod="Product & Platform Pod">
  Product & Platform Pod
</span>
```

**Pod-Colored Filter Buttons** (full-color accent when selected):
```tsx
<Button 
  variant={isSelected ? "default" : "outline"}
  data-pod="Marketing & PR Pod"
  className={isSelected ? "pod-accent" : ""}
>
  Marketing & PR Pod
</Button>
```

**Pod Borders**:
```tsx
<div className="pod-border" data-pod="Security & Compliance Pod">
  Content with pod-colored border
</div>
```

### Implementation Details

The pod color system uses a `--pod-current` variable that changes based on the `data-pod` attribute:

```css
/* Data attribute mapping (from pod-colors.css) */
[data-pod] { --pod-current: #3D6BFF; } /* Default fallback */
[data-pod='Creative Pod'] { --pod-current: #C95CAF; }
[data-pod='Product & Platform Pod'] { --pod-current: #0FA3B1; }
/* ... all 21 pods mapped */

/* Utility class implementations */
.pod-rail {
  background: var(--pod-current);
  height: 8px;
  width: 100%;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.pod-chip {
  display: inline-block;
  background: color-mix(in srgb, var(--pod-current) 20%, var(--background));
  border: 1px solid color-mix(in srgb, var(--pod-current) 50%, var(--border));
  color: var(--foreground);
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pod-accent {
  background: var(--pod-current);
  color: white;
}

.pod-border {
  border-color: var(--pod-current);
}
```

**Key Design Decisions**:
- **Rails**: Solid 8px colored bars for clear visual identification
- **Chips**: Subtle 20% tinted backgrounds with 50% colored borders, maintaining legibility
- **Accents**: Full-color backgrounds with white text for maximum emphasis (selected states)
- **Borders**: Direct pod color application for clean separation

**Files**: `client/src/ui/pod-colors/pod-colors.css`, `client/src/ui/pod-colors/pod-colors.json`

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
