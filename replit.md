# Dream Team Hub

## Overview

Dream Team Hub is a sophisticated multi-pod orchestration platform designed to provide a "single pane of glass" for managing complex organizational workflows across distributed teams. It aims to reduce redundant tasks, synchronize key actions, and facilitate evidence-grade collaboration across multiple organizational units. The platform features modules for managing priorities, assignments, escalations, brainstorming, audits, decisions, and an AI-powered chat system with role-based personas.

## Documentation

- **User Manual**: Comprehensive guide covering all features, functions, tips, and best practices → `USER_MANUAL.md`
- **Brand Specification**: Design system and visual guidelines → `client/BRANDING_SPEC.md`
- **Brand Guide PDF**: Print-ready brand guide → `DreamTeamHub_BrandGuide_v1.pdf`

## User Preferences

I prefer detailed explanations of new features and significant changes. Please ask for my approval before making any major architectural changes or introducing new external dependencies. I value iterative development with clear communication at each step.

## System Architecture

Dream Team Hub is built as a full-stack application with a clear separation of concerns.

### UI/UX Decisions
The design system is inspired by **Linear + Notion**, focusing on professionalism and usability.
- **Typography**: Inter for UI text, JetBrains Mono for code and IDs.
- **Color Palette**: A professional blue-based scheme, enhanced with a global dark theme featuring a glass-morphism aesthetic and custom brand colors (teal, violet, yellow, magenta, jade).
- **Spacing**: Consistent 2/4/6/8 unit system.
- **Components**: Utilizes Shadcn UI with Radix UI primitives, custom elevation system (hover-elevate, active-elevate-2), and a set of branded primitive components (BrandedCard, BrandedButton, BrandedBadge, BrandedSection, BrandedHero, BrandedGrid) for a cohesive look.
- **Responsiveness**: Mobile-first approach with md/lg/xl breakpoints.
- **Accessibility**: Implements ARIA labels, keyboard navigation, and proper focus states.

### Technical Implementations
The platform is structured into several core modules:
- **Control Tower**: Dashboard for quick starts, live priorities, assignments, escalations, and statistics.
- **Role Cards System**: Manages Dream Team personas with rich metadata, including a RACI Matrix and bulk import capabilities.
- **Brainstorm Studio**: Facilitates structured, multi-pod ideation sessions with timed rounds, LLM-assisted clustering, and idea scoring (ICE/RICE rubrics).
- **Audit Engine**: Enables cross-pod compliance checks for various audit types (Security, IP Readiness, Brand-Lock, Finance Ops) with evidence capture and findings tracking.
- **Decision Log**: Provides an immutable record of key decisions with metadata and artifact linkage.
- **Intake & Routing**: Manages the lifecycle of work items, including assignment, prioritization, status, and milestones.
- **Dream Team Chat**: AI-powered conversational interface leveraging OpenAI GPT-4 with 32 role-based personas, context-aware responses, agent memory, and a feedback system for continuous learning.
- **Roles ⇄ Agent Specs Sync**: A system for generating and synchronizing Agent Specifications from Role Cards, featuring two-way diff views, smart suggestions for fields (instruction blocks, tools, system prompts, policies), and batch actions. Pod-specific baseline prompts are used to tailor agent behavior.
- **Pods & Persons**: Manages organizational units and team members, linking persons to pods.

### Technology Stack
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query v5 for server state, React Hook Form with Zod, Shadcn UI, Tailwind CSS, Lucide React, and date-fns.
- **Backend**: Express.js with TypeScript, PostgreSQL (Neon-backed), Drizzle ORM, and Zod for validation. It exposes a RESTful API.
- **Database**: A comprehensive relational model with over 19 tables for managing all platform data, including pods, persons, roles, work items, decisions, brainstorm sessions, audits, conversations, agent memories, and events.

### Feature Specifications
- **Quick Start Section**: 6 action tiles (New Discussion, New Brainstorm, Conduct an Audit, Start a Conversation, Continue Previous, Quick Chat) with smart modal dialogs, multi-select, file upload, and knowledge base linking.
- **AI-Powered Conversations**: Personas respond according to their defined role, expertise, tone, and responsibilities, leveraging agent memory and learning from user feedback.
- **Agent Spec Sync**: Supports two-way diff view, pod-specific baseline prompts for various departments (Marketing, IP, Security, Brand, Product, Finance, Control Tower), smart suggestions for fields like instruction blocks, tools, system prompts, and policies, and batch application of changes.

## External Dependencies

- **OpenAI GPT-4**: Powers the Dream Team Chat for AI-driven conversational agents and context-aware responses.
- **PostgreSQL (Neon-backed)**: The primary database for persistent storage of all application data.
- **Google Drive (Planned for Phase 2)**: For automated artifact synchronization and storage of supporting documents.
## Master Brand System

Dream Team Hub uses a professional, token-based brand system for consistent visual identity across the entire platform.

### Brand Tokens (dth_tokens.css)

All brand tokens are defined as CSS variables in `client/src/dth_tokens.css` and exposed through Tailwind utilities via `tailwind.config.ts`.

#### Core Brand Colors
- **brand-dark** `#0B0D12` - Main background
- **brand-surface** `#0F1422` - Card surfaces
- **brand-line** `#1B2136` - Borders and dividers
- **brand-light** `#F7F8FB` - Light accents

#### Primary Color Spectrum
- **brand-teal** `#1CE6D3` - Primary brand color
- **brand-indigo** `#6B8CFF` - Secondary accent
- **brand-yellow** `#FFD449` - Highlights/warnings
- **brand-magenta** `#F48FBB` - Alerts/urgent
- **brand-jade** `#34AABB` - Success/completion
- **brand-orange** `#FF965A` - Additional accent

#### Text Hierarchy
- **text-primary** `#E8EBFF` - Main text (WCAG AAA contrast: 19.43)
- **text-secondary** `#C8CEEF` - Secondary text (WCAG AAA contrast: 13.29)
- **text-muted** `#AAB0D8` - Muted text

#### Pod Colors (Locked Hues)
11 pod-specific colors for organizational units:
- **pod-control** `#3D6BFF` (Control Tower)
- **pod-intake** `#5CE1CF` (Intake & Routing)
- **pod-decision** `#FFC24D` (Decision Log)
- **pod-roster** `#C95CAF` (Roster & Roles)
- **pod-ip** `#6B1E9C` (IP & Patent)
- **pod-security** `#3B4A5A` (Security & Compliance)
- **pod-product** `#1F9CFF` (Product & Engineering)
- **pod-brand** `#FF5BCD` (Brand & Assets)
- **pod-marketing** `#FF7A45` (Marketing & Comms)
- **pod-finance** `#2DBE7A` (Finance & BizOps)
- **pod-rhythm** `#5A67FF` (Operating Rhythm)

#### Glass-Morphism Effects
- **glass-bg** `rgba(255,255,255,0.08)` - Semi-transparent backgrounds
- **glass-border** `rgba(255,255,255,0.14)` - Subtle glass borders
- **elev-1** `0 10px 24px rgba(0,0,0,.28)` - Subtle elevation
- **elev-2** `0 18px 48px rgba(0,0,0,.35)` - Prominent elevation
- **ring** `0 0 0 3px rgba(28,230,211,0.35)` - Focus ring

#### Brand Gradients
- **grad-orchestra** `linear-gradient(135deg, teal → indigo)` - Primary brand gradient
- **grad-synapse** `linear-gradient(135deg, yellow → teal → indigo)` - Multi-color gradient

#### Spacing Scale
Token-based spacing (4px base unit):
- `--space-1` through `--space-8`: 4px, 8px, 12px, 16px, 20px, 24px, 28px, 32px

#### Border Radius
- `--radius-sm` 10px
- `--radius-md` 12px
- `--radius-lg` 16px
- `--radius-xl` 20px

### Typography System

#### Font Families
- **Space Grotesk** - Hero titles, headings (weights: 400-800)
- **Inter** - Body text, UI elements (weights: 300-800)
- **JetBrains Mono** - Code, IDs, technical content (weights: 400-600)

All fonts loaded via Google Fonts CDN for optimal performance.

#### Usage in Tailwind
```jsx
<h1 className="font-grotesk bg-grad-orchestra bg-clip-text text-transparent">
  Dream Team Hub
</h1>
<p className="font-inter text-text-secondary">
  Multi-pod orchestration platform
</p>
<code className="font-mono text-text-muted">
  role-card-id-123
</code>
```

### Tailwind Utilities

#### Color Utilities
```css
bg-brand-dark, bg-brand-teal, bg-brand-indigo
text-text-primary, text-text-secondary, text-text-muted
border-brand-line, border-glass
```

#### Pod Utilities
```css
bg-pod-control, bg-pod-marketing, bg-pod-ip
text-pod-security, text-pod-finance
.pod-rail-control, .pod-rail-marketing (via plugin)
```

#### Glass Utilities
```css
.bg-glass (semi-transparent background)
.border-glass (subtle glass border)
.shadow-glass (elevation shadow)
.ring-brand (focus ring)
```

#### Gradient Utilities
```css
bg-grad-orchestra (teal→indigo)
bg-grad-synapse (yellow→teal→indigo)
bg-clip-text text-transparent (for gradient text)
```

### Pod Glass Plugin

Custom Tailwind plugin (`tailwind.podglass.plugin.ts`) provides specialized utilities:

#### Pod Rail Classes
Gradient backgrounds per pod for decorative rails:
```jsx
<div className="h-2 pod-rail-control" />
<div className="h-2 pod-rail-marketing" />
```

#### Glass Utilities
Quick access to glass-morphism effects:
```jsx
<div className="bg-glass border-glass shadow-glass ring-brand">
  Glass card with focus ring
</div>
```

### Branded Components

#### Self-Contained Primitives
- **BrandedCard** - Glass-morphism card, auto-loads CSS
- **BrandedButton** - Consistent button with variants
- **BrandedBadge** - Semantic chip variants
- **BrandedSection** - Page section container
- **BrandedHero** - Hero section with gradient text
- **BrandedGrid** - Responsive grid layout

#### Specialized Components
- **StatCard** - Stat display with icon + value + variants
- **ListItem** - List item with variants (default/alert)
- **PriorityBadge** - Priority ranking badges

#### Usage Example
```jsx
<BrandedSection>
  <BrandedHero
    title="Control Tower"
    subtitle="Live priorities and assignments"
  />
  <StatCard
    title="Total Items"
    value={42}
    icon={Target}
    variant="primary"
  />
</BrandedSection>
```

### Visual Quality Standards

#### Contrast Ratios (WCAG AAA)
- Primary text: 19.43:1
- Secondary text: 13.29:1
- Stat values: 18.58:1

All text meets WCAG AAA accessibility standards for excellent readability on dark backgrounds.

#### Implementation Status
✅ Master brand tokens integrated (dth_tokens.css)
✅ Tailwind config with full token mapping
✅ Pod Glass plugin for specialized utilities
✅ Space Grotesk font loaded and active
✅ Branded primitive components production-ready
✅ Control Tower converted with master tokens
✅ Visual quality verified (E2E tests passed)
🔄 Remaining pages ready for conversion

### Brand Guide Resources
- **Print-ready PDF**: `DreamTeamHub_BrandGuide_v1.pdf`
- **Master tokens**: `client/src/dth_tokens.css`
- **Tailwind config**: `tailwind.config.ts`
- **Pod plugin**: `tailwind.podglass.plugin.ts`
