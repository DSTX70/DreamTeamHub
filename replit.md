# Dream Team Hub

## Overview

Dream Team Hub is a multi-pod orchestration platform designed to unify management, reduce redundancy, synchronize actions, and enhance collaboration across various organizational units for distributed teams. It provides a "single pane of glass" for comprehensive operational oversight and improved team efficiency through modules for priority management, assignments, escalations, brainstorming, audits, decisions, and an AI-powered chat system with role-based personas.

## User Preferences

I prefer detailed explanations of new features and significant changes. Please ask for my approval before making any major architectural changes or introducing new external dependencies. I value iterative development with clear communication at each step.

## System Architecture

Dream Team Hub is a full-stack application emphasizing a professional and usable design inspired by Linear and Notion, built with a clear separation of concerns.

### UI/UX Decisions
- **Design System**: Professional, inspired by Linear + Notion, utilizing Shadcn UI with Radix UI primitives.
- **Typography**: Inter for UI, JetBrains Mono for code, Space Grotesk for headings.
- **Color Palette**: Blue-based professional scheme with global dark theme, glass-morphism aesthetics, custom brand colors (teal, violet, yellow, magenta, jade), and 21 pod-specific colors for visual coding via a `data-pod` attribute system.
- **Components**: Custom elevation system, branded primitive components (e.g., BrandedCard, BrandedButton).
- **Responsiveness**: Mobile-first approach.
- **Accessibility**: WCAG AAA contrast ratios, ARIA labels, keyboard navigation.

### Technical Implementations
The platform is structured into core modules and features:
- **Control Tower**: Dashboard for operational oversight.
- **Business Unit Home Pages**: Dedicated landing pages for IMAGINATION, INNOVATION, and IMPACT with real-time brand portfolios, agent rosters, knowledge links (Google Drive integration), dashboard analytics, and recent activity feeds.
- **Projects**: Comprehensive project management with detail pages, task/file management, agent assignments, and project-specific Idea Sparks.
- **Idea Spark**: Quick idea capture (CRUD) accessible globally, with smart filtering and pod/project assignments.
- **Role Cards System**: Manages Dream Team personas with RACI Matrix, bulk import, and visual pod color coding.
- **Agent Lab Academy**: Interactive landing page displaying Agent Lab roles grouped by autonomy level, integrated into main navigation.
- **Agent Lab Integration**: External role card importer with CI/CD support via GitHub Actions and handle-based API endpoints.
- **Brainstorm Studio**: LLM-assisted ideation.
- **Audit Engine**: Cross-pod compliance checks.
- **Decision Log**: Immutable record of key decisions.
- **Dream Team Chat**: AI-powered conversational interface using OpenAI GPT-4 with 32 role-based personas, context awareness, and agent memory.
- **Roles ⇄ Agent Specs Sync**: Synchronizes Agent Specifications from Role Cards with two-way diff views and smart suggestions.
- **DTH Copilot**: AI-powered assistant using OpenAI tool-calling with dual-mode architecture (direct tool calling for instant responses + chat-based for Custom GPT). Features quick action buttons, paginated table views with formatted KPIs, and the **Findings at a Glance** analytics card that automatically calculates risk distribution (low/medium/high), identifies top at-risk agents, and suggests actionable next steps.
- **Universal Search**: Cmd+K powered search modal that searches across brands, products, projects, agents, and pods with relevance-based sorting, keyboard navigation, and paginated results. Features visible search button in header and comprehensive API with X-Total-Count headers for accurate pagination.
- **Breadcrumb Navigation**: Auto-generating breadcrumb component displays contextual hierarchy (i³ → BU → Brand → Product → Project → Task) across major pages including Control Tower, Projects, Roles, Academy, Copilot, Work Orders, and Business Unit home pages.

### Technology Stack
- **Frontend**: React 18, TypeScript, Wouter, TanStack Query v5, React Hook Form, Zod, Shadcn UI, Tailwind CSS.
  - **Reusable Components**: `FindingsAtAGlance` - Analytics summary card for agent performance metrics
- **Backend**: Express.js, TypeScript, Drizzle ORM.
  - **Copilot**: Dual-mode endpoint supporting direct tool calling (instant) and chat-based queries (Custom GPT)
  - **Analytics**: Real-time calculation of agent KPIs, risk categorization, and actionable insights
- **Database**: PostgreSQL (Neon-backed) with a comprehensive relational model (25 tables).

### Authentication & Security
- **Authentication Provider**: Replit Auth (OpenID Connect).
- **Security Architecture**: Dual authentication system with session-based auth for interactive users and API token auth for external integrations/CI/CD.

### Staging Environment
- **Automated Weekly Refresh**: GitHub Actions workflow refreshes staging database every Monday at 07:00 UTC using Greenmask for PII masking.
- **Access Control**: Staging guard middleware provides dual authentication - basic auth (username/password) or IP allowlist with CIDR notation support.
- **Health Monitoring**: `/healthz` endpoint for uptime monitoring, bypasses authentication.
- **Referential Integrity Validation**: Automated SQL tests after each staging refresh to ensure data consistency.
- **Configuration**: 
  - Workflow: `.github/workflows/staging_refresh.yml`
  - Middleware: `server/middleware/stagingGuard.ts`
  - Environment activation: `NODE_ENV=staging`
  - Required secrets: `PROD_DB_URL`, `STAGING_DB_URL` (GitHub Secrets)
  - Optional IP allowlist: `ALLOWED_IPS` environment variable

## API Endpoints

Dream Team Hub exposes a RESTful API with dual authentication support:

### Public Endpoints
- `GET /healthz` - Health check for uptime monitoring (no auth required)

### Role Cards API (Dual Authentication)
- `GET /api/roles` - List all role cards with pagination
- `GET /api/roles/by-handle/{handle}` - Get role by handle
- `POST /api/roles` - Create new role card
- `PUT /api/roles/by-handle/{handle}` - Update role by handle

### Agents API (Dual Authentication)
- `GET /api/agents/summary` - List agent summaries for Academy dashboard
  - Supports filtering by business unit, autonomy level, status
  - Includes pagination (limit/offset) and text search
  - Returns KPIs (task_success, latency_p95_s, cost_per_task_usd)
  - Includes promotion progress and links to evidence packs

### Universal Search API (Session Auth)
- `GET /api/search` - Universal search across all entities
  - Query parameters: `q` (required), `limit` (default: 20), `offset` (default: 0), `types` (optional filter)
  - Searches across brands, products, projects, agents, and pods
  - Returns relevance-sorted results with X-Total-Count header for pagination
  - Response includes type, id, title, subtitle, url, and context for each result

### Authentication Methods
1. **Session Auth**: Replit Auth login (for web UI)
2. **API Token**: Bearer token in Authorization header (for external integrations, ChatGPT agents, CI/CD)

### Documentation
- Full OpenAPI spec: `docs/API_SPEC_v0.1.1.yaml`
- Postman collection: `docs/POSTMAN_COLLECTION.json`
- GPT Actions schema: `docs/GPT_ACTIONS_SCHEMA.yaml`
- Comprehensive guide: `docs/API_ENDPOINTS_GUIDE.md`

## External Dependencies

- **OpenAI GPT-4**: Powers the AI-driven conversational agents in Dream Team Chat.
- **PostgreSQL (Neon-backed)**: Primary database for persistent storage.
- **Replit Auth**: Provides secure user authentication via OpenID Connect.