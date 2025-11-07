# Dream Team Hub

## Overview

Dream Team Hub is a multi-pod orchestration platform designed to unify management, reduce redundancy, synchronize actions, and enhance collaboration across various organizational units for distributed teams. It provides a "single pane of glass" for comprehensive operational oversight and improved team efficiency through modules for priority management, assignments, escalations, brainstorming, audits, decisions, and an AI-powered chat system with role-based personas. The platform aims to streamline operations, foster innovation, and increase overall team productivity.

## User Preferences

I prefer detailed explanations of new features and significant changes. Please ask for my approval before making any major architectural changes or introducing new external dependencies. I value iterative development with clear communication at each step.

## System Architecture

Dream Team Hub is a full-stack application emphasizing a professional and usable design inspired by Linear and Notion, built with a clear separation of concerns.

### UI/UX Decisions
The design system is professional, inspired by Linear and Notion, utilizing Shadcn UI with Radix UI primitives. It features Inter, JetBrains Mono, and Space Grotesk fonts, a blue-based professional color scheme with a global dark theme, glass-morphism aesthetics, custom brand colors, and 21 pod-specific colors. Components include a custom elevation system and branded primitives. The design follows a mobile-first approach with WCAG AAA accessibility standards.

### Technical Implementations
The platform includes core modules for operational oversight (Control Tower), dedicated Business Unit Home Pages (IMAGINATION, INNOVATION, IMPACT) with real-time data, and comprehensive Project management. Key features include a global Idea Spark for quick idea capture, a Role Cards System for managing Dream Team personas with RACI Matrix integration, and the Agent Lab Academy for role management.

AI-powered features consist of Brainstorm Studio (LLM-assisted ideation), Dream Team Chat (OpenAI GPT-4 with 32 role-based personas and context awareness), and DTH Copilot (AI assistant with OpenAI tool-calling, quick actions, and "Findings at a Glance" analytics).

Core operational systems include a Universal Search (Cmd+K), auto-generating Breadcrumb Navigation (deployed across all Ops pages with role badge indicators), and an Operations Events Logging system for telemetry and audit trails, viewable via the Operations Logs Admin Page.

Knowledge management is supported by a Knowledge Publishing System with database-level idempotency and Google Drive Integration for Business Unit-specific content. Work Orders System enables real LLM execution via OpenAI, Anthropic, and Vertex AI with budget caps, rate limiting, and cost tracking. An LLM Provider Infrastructure integrates these services with robust error handling and cost tracking.

The platform also features an Alert Notification System for multi-channel delivery (Slack, webhooks), an Evidence Pack System for agent training evidence management, and an Academy Sidebar for agent training and promotion. A Two-Reviewer Publish Workflow ensures content approval.

An Ops Dashboard & Observability provides real-time operational metrics, displaying PUBLISH events, draft uploads, work order runs, and error rates, with lightweight alert rules.

**Ops Overview Dashboard** serves as a unified operational command center, aggregating key metrics from all subsystems:
- **Inventory**: Displays low-stock SKU count with quick link to `/ops/inventory`
- **Images**: Shows S3 bucket status, connectivity probe, and Cache-Control configuration with link to `/ops/images`
- **Affiliates**: Presents 7-day performance metrics (clicks, unique visitors, orders, revenue, commission at 10%) with link to `/ops/affiliates`
- **LLM Linter**: Displays active rule count for JSON schema validation with link to `/llm/provider/linter`
- **Environment Health**: Real-time status of critical environment variables (DATABASE_URL, S3_BUCKET, OPS_API_TOKEN, AWS_REGION) with OK/Missing badges

This single-pane view enables rapid assessment of system health and provides one-click navigation to detailed management interfaces.

Future phases include an Onboarding Wizard for brand/product creation and Coverage Views for role staffing analysis.

**Completed E-Commerce Features (November 2025):**
- **Affiliate E2E Tracking:** Database-backed affiliate management with pixel-based click/conversion tracking, 30-day rolling metrics, and attribution deduplication
- **Affiliate Rates & Payouts:** Per-affiliate commission rate overrides (nullable, falls back to default), status management (active/suspended), admin UI at `/ops/affiliates/admin` with case-insensitive code filter (URL param and input field), payout calculations with date range filtering and CSV export at `/ops/affiliates/payouts`, visual badges in report for rate overrides and suspension status, Edit links in report that navigate to admin with pre-filtered code, contextual back navigation ("← Back to Report" when filtered), open-in-new-tab icons for cross-page navigation
- **Low-Stock Inventory Scheduler:** DB-backed scheduler with webhook (Slack) and email (SMTP) notifiers, 60-second scan interval, 5-minute alert throttling, and comprehensive event logging
- **Ops Settings UI:** Granular management interface at `/ops/settings` with role-based sub-routes (Alerts for ops_editor, Global for ops_admin), auto-redirect logic, webhook/email configuration, notification testing, and manual inventory scans
- **Breadcrumb Navigation System:** Reusable breadcrumb component deployed across Ops pages (Settings, Images, Inventory) showing hierarchical path with role badge indicators
- **Cross-Page Navigation UX:** Consistent open-in-new-tab icons (ExternalLink from lucide-react) on Settings links in Images and Inventory pages, contextual escape hatches for filtered views
- **Saved Addresses & Checkout:** Complete checkout flow with address management
- **Responsive Images with S3:** Sharp-based image transformation with AWS S3 storage
- **Client-side Prompt Linter:** LLM schema validation for Work Orders
- **CI/CD Pipeline:** GitHub Actions workflow with Node 20, pnpm, type-checking, tests, and environment health validation (with forked PR support)
- **Environment Health Monitoring:** Real-time dashboard display and validation script for critical environment variables

### Technology Stack
The frontend utilizes React 18, TypeScript, Wouter, TanStack Query v5, React Hook Form, Zod, Shadcn UI, and Tailwind CSS. The backend is built with Express.js, TypeScript, and Drizzle ORM. PostgreSQL, backed by Neon, serves as the primary database with a comprehensive relational model.

### Database Schema
Core tables include agents, agent_specs, projects, tasks, ideas, decisions, business_units, knowledge_items, work_orders, operations_events, and brand_products. E-commerce tables include affiliates (with name, commission_rate, and status columns), aff_clicks, aff_attributions, inventory_products, and inventory_events. All tables use appropriate indexes for performance optimization.

### Authentication & Security
Authentication is provided by Replit Auth (OpenID Connect). The security architecture employs a dual authentication system (session-based and API token auth) and a Helmet-based Content Security Policy (CSP). 

**Role-Based Access Control (Ops):**
- **ops_viewer** (read-only): All authenticated users receive this base role
- **ops_editor** (alerts management): Valid email addresses get editor permissions; can manage alert settings at `/ops/settings/alerts`
- **ops_admin** (full access): Specific admin list gets complete access including global settings at `/ops/settings/global`
- Auto-redirect from `/ops/settings`: editors → alerts, admins → global (configurable via `server/routes/ops_auth.route.ts`)
- Client-side role gates with `RequireRole` component; server-side enforcement as source of truth

Scope-Based Authorization uses `requireScopes()` middleware. Routes support dual authentication via `isDualAuthenticated`. Rate limiting is enforced with `429` status and `Retry-After` headers. Idempotency protection is implemented for knowledge publish endpoints using the `Idempotency-Key` header.

### CI/CD & Deployment
**GitHub Actions CI Pipeline:**
- Automated testing on push and pull requests
- Node 20 with pnpm package management
- TypeScript type-checking
- Environment health validation with required variables: DATABASE_URL, AWS_S3_BUCKET, OPS_API_TOKEN
- Optional variables with defaults: AWS_REGION (defaults to us-east-1)
- Forked PR support with secret handling safeguards
- Test suite execution with comprehensive coverage

**Environment Health Script** (`scripts/check-env.ts`):
- Validates presence of required environment variables
- Masks sensitive values in output for security
- CI-aware execution with graceful handling of missing secrets
- Exit code 1 on validation failure, 0 on success

### Staging Environment
The staging environment features automated weekly database refreshes using Greenmask for PII masking, access control via basic auth or IP allowlist, a `/healthz` endpoint for monitoring, and automated SQL tests for referential integrity validation.

## External Dependencies

- **OpenAI GPT-4**: Powers AI-driven conversational agents and the DTH Copilot.
- **PostgreSQL (Neon-backed)**: Primary database for persistent data storage.
- **Replit Auth**: Provides secure user authentication.
- **Google Drive API**: Integrated for knowledge management (search, upload drafts, publish files).
- **AWS S3**: Used for responsive image storage.
- **Sharp**: Image processing library for responsive images.
- **Multer**: Handles file uploads for image processing.
- **Anthropic Claude-3.5 Sonnet**: Alternative LLM provider for Work Orders execution.
- **Vertex AI Gemini Pro**: Alternative LLM provider for Work Orders execution.
- **Slack**: Used for multi-channel alert delivery.