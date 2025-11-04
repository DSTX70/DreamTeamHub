# Dream Team Hub

## Overview

Dream Team Hub is a multi-pod orchestration platform designed to streamline complex organizational workflows for distributed teams. It aims to unify management, reduce redundancy, synchronize actions, and enhance collaboration across various organizational units. The platform includes modules for managing priorities, assignments, escalations, brainstorming, audits, decisions, and features an AI-powered chat system with role-based personas. Its ultimate purpose is to provide a "single pane of glass" for comprehensive operational oversight and improved team efficiency.

## User Preferences

I prefer detailed explanations of new features and significant changes. Please ask for my approval before making any major architectural changes or introducing new external dependencies. I value iterative development with clear communication at each step.

## System Architecture

Dream Team Hub is a full-stack application built with a clear separation of concerns, emphasizing a professional and usable design inspired by Linear and Notion.

### UI/UX Decisions
- **Design System**: Professional, inspired by Linear + Notion.
- **Typography**: Inter for UI, JetBrains Mono for code.
- **Color Palette**: Blue-based professional scheme with a global dark theme, glass-morphism aesthetics, and custom brand colors (teal, violet, yellow, magenta, jade). Includes 21 pod-specific colors for visual coding.
- **Pod Color System**: Data-attribute-based theming system (`data-pod`) with CSS custom properties enabling visual differentiation of 21 organizational pods across agent cards and UI components. Includes utility classes (`.pod-rail`, `.pod-chip`, `.pod-accent`, `.pod-border`) and Tailwind plugin for consistent color application.
- **Spacing**: Consistent 2/4/6/8 unit system.
- **Components**: Utilizes Shadcn UI with Radix UI primitives, a custom elevation system, and branded primitive components (e.g., BrandedCard, BrandedButton).
- **Responsiveness**: Mobile-first approach.
- **Accessibility**: ARIA labels, keyboard navigation, and focus states. WCAG AAA contrast ratios for text.

### Technical Implementations
The platform is structured into several core modules:
- **Control Tower**: Dashboard for priorities, assignments, escalations, statistics, and recent Idea Sparks.
- **Projects**: Comprehensive project management system organized by business pillars (Imagination, Innovation, Impact) with task management, file management with review workflow, agent/pod assignments, status tracking, project messaging, and project-specific Idea Sparks.
- **Idea Spark**: Quick idea capture feature accessible from all authenticated screens via floating button. Allows users to capture ideas with title, description, file URL, pod assignment, and project linkage. Dashboard shows all recent sparks; Projects page shows only project-related sparks.
- **Role Cards System**: Manages Dream Team personas with RACI Matrix and bulk import. Features visual pod color coding with 21 unique pod colors displayed via colored rails and badges on agent cards.
- **Agent Lab Integration**: External role card importer system with CI/CD support via GitHub Actions, handle-based API endpoints, and dual authentication (session + API token).
- **Brainstorm Studio**: Structured ideation with LLM-assisted clustering and idea scoring.
- **Audit Engine**: Cross-pod compliance checks with evidence capture.
- **Decision Log**: Immutable record of key decisions.
- **Intake & Routing**: Manages work item lifecycle.
- **Dream Team Chat**: AI-powered conversational interface using OpenAI GPT-4 with 32 role-based personas, context-aware responses, and agent memory.
- **Roles ⇄ Agent Specs Sync**: Synchronizes Agent Specifications from Role Cards with two-way diff views and smart suggestions.
- **Pods & Persons**: Manages organizational units and team members.

### Technology Stack
- **Frontend**: React 18, TypeScript, Wouter, TanStack Query v5, React Hook Form, Zod, Shadcn UI, Tailwind CSS, Lucide React, date-fns.
- **Backend**: Express.js, TypeScript, PostgreSQL (Neon-backed), Drizzle ORM, Zod. Exposes a RESTful API.
- **Database**: Comprehensive relational model with 25 tables including projects system (projects, project_files, project_agents, project_tasks, project_messages) and idea_sparks table.

### Feature Specifications
- **Quick Start Section**: Provides 6 action tiles (e.g., New Discussion, Brainstorm, Audit) with smart modals.
- **Idea Spark Capture**: Floating action button accessible from all screens for quick idea capture. Supports title, content, file URL, pod tagging, and project linkage. Smart filtering shows all sparks on Dashboard and only project-linked sparks on Projects page.
- **Interactive Demo Viewer**: Standalone HTML-based demo showcasing the entire platform with interactive tabs (Overview, Features, Architecture, Pods, Tech), embedded in-app with export functionality for sharing.
- **AI-Powered Conversations**: Personas respond based on their defined role, expertise, and context, leveraging agent memory.
- **Agent Spec Sync**: Features two-way diff view, pod-specific baseline prompts, smart suggestions for agent fields, and batch application of changes.

### Authentication & Security
- **Authentication Provider**: Replit Auth (OpenID Connect) supporting Google, GitHub, Apple, X, and email/password.
- **Security Architecture**: Dual authentication system - session-based auth for interactive users, API token auth for external integrations/CI/CD.
  - Session Auth: All web API routes protected with `isAuthenticated` middleware; stored in PostgreSQL with secure cookie configuration.
  - API Token Auth: Bearer token authentication for external importers and GitHub Actions workflows via `DTH_API_TOKEN` environment variable.
- **Database Schema**: `users` and `sessions` tables manage user data and session information.

### Master Brand System
- **Brand Tokens**: Defined as CSS variables for consistent theming.
- **Typography System**: Space Grotesk (headings), Inter (body), JetBrains Mono (code).
- **Branded Components**: Self-contained primitive components (e.g., BrandedCard, BrandedButton) ensure visual consistency.

## External Dependencies

- **OpenAI GPT-4**: Powers the AI-driven conversational agents in Dream Team Chat.
- **PostgreSQL (Neon-backed)**: Primary database for persistent storage.
- **Replit Auth**: Provides secure user authentication via OpenID Connect.

## API Integration & CI/CD

### Agent Lab Role Card Importers

Dream Team Hub supports external role card imports from the Agent Lab collection through a dual authentication API system:

#### API Endpoints

**Handle-Based Endpoints** (for external integrations):
- `GET /api/roles/by-handle/:handle` - Fetch role by handle/key
- `PUT /api/roles/by-handle/:handle` - Update role by handle/key
- `POST /api/roles` - Create new role card

**Authentication Methods**:
1. **API Token** (for CI/CD): `Authorization: Bearer <DTH_API_TOKEN>` header
2. **Session Auth** (for manual testing): Replit Auth login session

#### Importer Workflow

Located in `Agent-Lab/` directory:
- **Manifest**: `00_Canonical/roles/roles_manifest.jsonl` - JSONL file listing all role cards
- **Importer Script**: `importers/dth_import_roles.js` - Node.js script implementing upsert logic (GET → 404 → POST, or 200 → PUT)
- **Manifest Regeneration**: `tools/regenerate_roles_manifest.{js,py}` - Auto-generates manifest from role JSON files

#### GitHub Actions Integration

Workflow: `.github/workflows/dth_import_roles.yml`
- **Triggers**: Push to role files, PR reviews, manual dispatch
- **Modes**: Dry-run for PRs, live import for main branch pushes
- **Artifacts**: Importer logs and Agent-Lab bundle ZIP
- **Secrets Required**: `DTH_API_BASE`, `DTH_API_TOKEN`

#### Pre-Commit Hook

Husky hook: `.husky/pre-commit`
- Auto-regenerates manifest when role JSON files change
- Stages updated manifest automatically
- Supports both Python and Node.js regenerators

#### Environment Variables

- `DTH_API_BASE` - Base URL for DTH API (e.g., `https://your-dth.replit.app/api`)
- `DTH_API_TOKEN` - Secure authentication token for external integrations

See `Agent-Lab/README.md` for detailed usage instructions.