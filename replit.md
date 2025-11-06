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
- **Brainstorm Studio**: LLM-assisted ideation.
- **Audit Engine**: Cross-pod compliance checks.
- **Decision Log**: Immutable record of key decisions.
- **Dream Team Chat**: AI-powered conversational interface using OpenAI GPT-4 with 32 role-based personas, context awareness, and agent memory.
- **DTH Copilot**: AI-powered assistant using OpenAI tool-calling with dual-mode architecture (direct tool calling for instant responses + chat-based for Custom GPT). Features quick action buttons, paginated table views with formatted KPIs, and the **Findings at a Glance** analytics card that automatically calculates risk distribution (low/medium/high), identifies top at-risk agents, and suggests actionable next steps.
- **Universal Search**: Cmd+K powered search modal that searches across brands, products, projects, agents, and pods with relevance-based sorting, two-zone keyboard navigation (Quick Actions + Results), localStorage-based recent searches memory (last 8 searches), and infinite scroll pagination with IntersectionObserver.
- **Breadcrumb Navigation**: Auto-generating breadcrumb component displays contextual hierarchy across major pages.
- **Operations Events Logging**: Fire-and-forget telemetry system tracks user interactions across the platform with automatic actor inference, request correlation IDs, and metadata enrichment for analytics and audit trails.
- **Operations Logs Admin Page**: Full-featured admin interface for viewing and filtering operational events with real-time updates, CSV export, auto-refresh (5s interval), and comprehensive filtering.
- **Knowledge Publishing System**: File publishing API with database-level idempotency protection using PostgreSQL partial unique index.
- **Google Drive Integration**: Service account-based integration with Drive Gateway API endpoints for searching, uploading drafts, and publishing files, supporting Business Unit-specific knowledge management.
- **Work Orders System**: Database-backed work order execution with budget caps enforcement (runs/day and $/day limits), featuring rate limiting and automatic cap validation.
- **Academy Sidebar**: Interactive agent training and promotion interface integrated into Academy page, Business Unit home pages, and Project detail pages. Displays promotion progress, evidence pack links, and allows one-click agent advancement.
- **Two-Reviewer Publish Workflow**: Modal-based publish approval system with custom React hook (usePublishDialog) supporting idempotency via Idempotency-Key header.
- **Ops Dashboard & Observability**: Real-time operational metrics dashboard displaying 24-hour counts for PUBLISH events, draft uploads, work order runs, error rates, and 429 rate limits. Features lightweight alert rules for PUBLISH errors (>2 in 10min), 5xx errors (>1%), and rate limit spikes, with auto-refresh every 30 seconds and visual alert indicators.
- **Onboarding Wizard (Phase-2)**: Multi-step wizard for creating brands with Google Drive folder links, optional product creation with Drive integration, validates URL formats, and creates complete brand/product hierarchies in one workflow.
- **Coverage Views (Phase-2)**: Role staffing analysis showing unstaffed roles (no agents assigned), over-replicated roles (exceeding configurable threshold), and complete coverage table with agent counts per role. Dynamic threshold adjustment allows flexible over-replication detection.
- **Playbooks Registry (Phase-2)**: Create, edit, and manage reusable playbooks (handle-based references) for Work Orders. Playbooks store markdown content and can be referenced by unique handles in work order configurations, enabling standardized operational procedures.

### Technology Stack
- **Frontend**: React 18, TypeScript, Wouter, TanStack Query v5, React Hook Form, Zod, Shadcn UI, Tailwind CSS.
- **Backend**: Express.js, TypeScript, Drizzle ORM, Zod validation.
- **Database**: PostgreSQL (Neon-backed) with a comprehensive relational model (25 tables).

### Authentication & Security
- **Authentication Provider**: Replit Auth (OpenID Connect).
- **Security Architecture**: Dual authentication system with session-based auth for interactive users and API token auth for external integrations/CI/CD.
- **Content Security Policy (CSP)**: Helmet-based CSP middleware mounted globally, strict in production.
- **Scope-Based Authorization**: Protected routes use `requireScopes()` middleware. All authenticated users receive full operator scopes for simplified permission.
- **Dual Authentication Middleware**: Routes use `isDualAuthenticated` to support both session and Bearer token flows.
- **Rate Limiting**: Work Order caps enforced with `429` status + `Retry-After` header.
- **Idempotency Protection**: Knowledge publish endpoints support `Idempotency-Key` header to prevent duplicate operations.

### Staging Environment
- **Automated Weekly Refresh**: GitHub Actions workflow refreshes staging database weekly using Greenmask for PII masking.
- **Access Control**: Staging guard middleware provides dual authentication - basic auth or IP allowlist.
- **Health Monitoring**: `/healthz` endpoint for uptime monitoring, bypasses authentication.
- **Referential Integrity Validation**: Automated SQL tests after each staging refresh.

## External Dependencies

- **OpenAI GPT-4**: Powers the AI-driven conversational agents in Dream Team Chat and DTH Copilot.
- **PostgreSQL (Neon-backed)**: Primary database for persistent storage.
- **Replit Auth**: Provides secure user authentication via OpenID Connect.
- **Google Drive API**: Integrated for knowledge management features (search, upload drafts, publish files).

## Go-Live Readiness Documentation

Comprehensive operational documentation for production deployment:

### Environment Configuration
- **`docs/GO_LIVE_ENV_VARS.md`**: Complete reference for all required environment variables and secrets
  - Database configuration (PostgreSQL auto-provided)
  - Authentication secrets (SESSION_SECRET, DTH_API_TOKEN, REPL_ID, ISSUER_URL)
  - OpenAI API integration (OPENAI_API_KEY, model selection, rate limits)
  - Google Drive Service Account (GDRIVE_SA_EMAIL, GDRIVE_SA_PRIVATE_KEY)
  - Rate limiting configuration (COPILOT_REQS_PER_MIN)
  - Staging environment settings
  - Pre-launch checklist and troubleshooting guide

### Database Backup & Recovery
- **`docs/BACKUP_CONFIGURATION.md`**: Database backup strategy and disaster recovery procedures
  - Replit PostgreSQL point-in-time restore (14-day retention requirement)
  - Restore procedures with step-by-step instructions
  - Recovery Time Objective (RTO): <1 hour
  - Recovery Point Objective (RPO): <5 minutes
  - Backup validation and testing procedures
  - Compliance and audit trail documentation

### Security & Access Control
- **`docs/GDRIVE_LEAST_PRIVILEGE_CHECKLIST.md`**: Google Drive Service Account security verification
  - Least-privilege folder permission matrix (9 folders: 3 BUs × 3 roles)
  - Service Account setup and configuration steps
  - Folder structure (read/, draft/, publish/ per Business Unit)
  - Permission verification checklist with test procedures
  - Security audit guidelines
  - Quarterly review schedule

### Operational Runbooks
- **`docs/RUNBOOK_PUBLISH_INCIDENT.md`**: Knowledge Publishing incident response (1-pager)
  - File published to wrong folder recovery
  - Duplicate publish (idempotency failure) resolution
  - Publish failure troubleshooting (403, 500, timeout errors)
  - X-Request-Id distributed tracing across operations events
  - Rollback procedures (move file from publish/ to draft/)
  - SQL queries for audit trail and event correlation

- **`docs/RUNBOOK_WORK_ORDERS.md`**: Work Orders budget management (1-pager)
  - Budget cap enforcement (calendar day: midnight to midnight UTC)
  - Rate limit response handling (HTTP 429 with Retry-After: 86400)
  - Safe cap adjustment workflows with approval levels
  - Cost analysis and optimization guidance
  - Suspicious activity detection and response
  - SQL queries for usage monitoring (NOTE: cost column is TEXT, requires `::numeric` cast)

### Key Operational Notes
- **Work Orders Budget Window**: Calendar day (midnight to midnight UTC), NOT rolling 24-hour window
- **429 Response Format**: Simple `{ "error": "..." }` - usage metrics are in operations_events table
- **Cost Column Type**: TEXT in database, always use `::numeric` cast in SQL aggregations
- **Retry-After Location**: `server/api/work_orders.route.ts` lines 84, 106
- **Default Caps**: 100 runs/day, $2.00/day (often adjusted to $5.00+ in production)
- **Idempotency Protection**: Publish endpoints support `Idempotency-Key` header, stored in published_knowledge table
- **Service Account Scopes**: Full Drive API scope at OAuth level, folder-level permissions via sharing