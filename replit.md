# Dream Team Hub

## Overview

Dream Team Hub is a multi-pod orchestration platform designed to unify management, reduce redundancy, synchronize actions, and enhance collaboration across various organizational units for distributed teams. It provides a "single pane of glass" for comprehensive operational oversight and improved team efficiency through modules for priority management, assignments, escalations, brainstorming, audits, decisions, and an AI-powered chat system with role-based personas. The platform aims to streamline operations, foster innovation, and increase overall team productivity.

## User Preferences

I prefer detailed explanations of new features and significant changes. Please ask for my approval before making any major architectural changes or introducing new external dependencies. I value iterative development with clear communication at each step.

## System Architecture

Dream Team Hub is a full-stack application emphasizing a professional and usable design inspired by Linear and Notion, built with a clear separation of concerns.

### UI/UX Decisions
The design system is professional, inspired by Linear and Notion, utilizing Shadcn UI with Radix UI primitives. It features Inter, JetBrains Mono, and Space Grotesk fonts, a blue-based professional color scheme with a global dark theme, glass-morphism aesthetics, custom brand colors, and 21 pod-specific colors. Components include a custom elevation system and branded primitives. The design follows a mobile-first approach with WCAG AAA accessibility standards.

**Brand System Integration**: The platform now supports multi-brand theming with the Fab Card Co (FCC) brand drop fully integrated:
- Design tokens pipeline: `design/fabcardco.tokens.json` → `scripts/tokens_to_css.mjs` → `client/src/styles/brands/fcc.tokens.css`
- BrandScope component (`client/src/components/brands/BrandScope.tsx`) enables per-page brand scoping via `data-brand="fcc"` attribute
- Tailwind-accessible FCC brand lines: outLoud (pridePurple, hotCoral, electricTeal), colorCue (mintTeal, periwinkle, maize), midnightExpress (goldFoil, silverFoil), heartScript (coralRed, softLilac, blushPink, wineRed)
- Token regeneration: `node scripts/tokens_to_css.mjs ./design/fabcardco.tokens.json ./client/src/styles/brands/fcc.tokens.css`

### Technical Implementations
The platform includes core modules for operational oversight (Control Tower), dedicated Business Unit Home Pages (IMAGINATION, INNOVATION, IMPACT) with real-time data, and comprehensive Project management. Key features include a global Idea Spark for quick idea capture, a Role Cards System for managing Dream Team personas with RACI Matrix integration, and the Agent Lab Academy for role management.

AI-powered features consist of Brainstorm Studio (LLM-assisted ideation), Dream Team Chat (OpenAI GPT-4 with 32 role-based personas, context awareness, and multi-participant conversations with pod expansion), and DTH Copilot (AI assistant with OpenAI tool-calling, quick actions, and "Findings at a Glance" analytics).

**Chat Participants Enhancement**: The chat system now supports multi-participant conversation creation with flexible participant selection (individual persons or entire pods). Key features include:
- ParticipantsMultiSelect component with search and multi-select UI for both people and pods
- Automatic pod member expansion (selecting a pod adds all its members as participants)
- Conversation kickoff messages for context setting
- Database schema with conversation_participants table supporting dual principal types ('user'|'pod')
- Transaction-safe API endpoints (POST /api/chat/conversations, GET /api/chat/conversations/:id/participants)
- Comprehensive e2e test coverage verifying participant storage and retrieval

Core operational systems include a Universal Search (Cmd+K), auto-generating Breadcrumb Navigation, and an Operations Events Logging system for telemetry and audit trails. Knowledge management is supported by a Knowledge Publishing System with database-level idempotency and Google Drive Integration. A Work Orders System enables real LLM execution via OpenAI, Anthropic, and Vertex AI with budget caps, rate limiting, and cost tracking, supported by an LLM Provider Infrastructure.

The platform also features an Alert Notification System, an Evidence Pack System for agent training evidence management, and an Academy Sidebar. A Two-Reviewer Publish Workflow ensures content approval. An Ops Dashboard & Observability provides real-time operational metrics, including an Ops Overview Dashboard for unified operational command.

Completed e-commerce features include Affiliate E2E Tracking, Affiliate Rates & Payouts, Inventory Notification Overrides, Low-Stock Inventory Scheduler, and an Ops Settings UI. Responsive Images with S3 integration and client-side LLM Prompt Linter are also implemented.

An SEO Alt Text CSV Pipeline enables ops admins to import image accessibility metadata from CSV files attached to work items. Features include database-backed alt text storage (alt_texts table with image_key/locale unique constraint), POST /api/seo/alt-text/import endpoint with S3 CSV download and validation, GET /api/seo/alt-text query endpoint, Ops UI at /ops/alt-text with work item and CSV file selection, robust error handling with row-level validation (including invalid date detection), and helper functions (getAlt, getAltEntry, useAltText) for retrieving alt text in React components.

A Hybrid Uploader Configuration System provides runtime-editable file upload settings with environment-locked sensitive settings (storage backend) and database-stored operational settings (allowlist, size limits, visibility) with full audit trail and ops_admin RBAC protection. Includes comprehensive automated testing infrastructure (backend validation tests, audit trail monitoring utilities, and e2e test specifications), Audit Trail page at `/ops/audit` for real-time config change monitoring with trigger verification, summary statistics, and filterable records.

**MIME Type Validation Enhancement**: The uploader now supports MIME type validation alongside legacy file extension validation. Features include:
- `allowed_types` field (MIME types array) alongside legacy `allowlist` (file extensions)
- `list_page_size` parameter for pagination control
- Dual parameter support (`max_file_mb` and `maxSizeMB`) for backward compatibility
- Layered validation: MIME type check first, fallback to extension validation
- Prevents regressions for files with unknown/alternate MIME types (e.g., application/x-zip-compressed)
- FilesPanel component uses MIME types for `accept` attribute when configured
- Server-side validation in uploadFileToS3 enforces MIME type rules with extension fallback
- Clear error messages showing both allowed MIME types and extensions

A Work Order File Linkage System connects work_orders to work_items for file management, keeping files anchored to work_items while providing WO-scoped views. The system includes a work_order_id column in work_items (varchar FK to work_orders.id with SET NULL/CASCADE semantics), a work_order_files database view for aggregated file listing, GET /api/work-orders/:woId/files endpoint for querying files, and client helpers (listWorkOrderFiles, getConfig, getDefaultVisibility) in client/src/lib/workOrderFiles.ts. This architecture avoids parallel attachment systems while enabling both WO-level and WI-level file views.

**AI-Powered Pack Generation System**: A comprehensive config-driven system for generating 20+ specification pack types across Brand/Creative, Governance, Operations, Partnerships, Data, and Expansion categories. The Pack System uses a registry architecture (`PACK_REGISTRY` in `server/ai/packRegistry.ts`) as the single source of truth, automatically wiring routes, handlers, schemas, skills, and exports.

Key features:
- **20 Pack Types**: Includes Lifestyle, Patent, Launch Plan, Website Audit, Risk & Compliance, Agent Lab Academy (6 legacy), plus Agent Governance, Pricing & Monetization, Data Stewardship, GlobalCollabs Partnerships, Packaging & Pre-Press, Product Line & SKU Tree, E-Com PDP, Social Campaign, Implementation Runbook, Support Playbook, Retail Readiness, Experiment Optimization, Localization, and Customer Journey (14 new)
- **Registry-Driven Architecture**: Derived `PackType` from `PACK_REGISTRY` eliminates type drift across persistence, export, and drive integration modules
- **LLM Skill Integration**: Each pack uses OpenAI GPT-4 with schema-aligned JSON prompts for high-quality output generation. Prompts include explicit JSON structure, exact enum values, minimum array lengths, and comprehensive examples to ensure schema validation success
- **Versioned Storage**: `work_item_packs` table with auto-incrementing versions per pack_type. Each regeneration creates a new row (not updates), enabling complete version history (v1, v2, v3...)
- **Dual Export System**: Custom DOCX exporters for 6 legacy packs, generic DOCX converter for 14 new packs with hierarchical headings and automatic array→table conversion
- **Google Drive Integration**: Auto-configured pack folders from registry for seamless publishing
- **Transaction-Safe Persistence**: `saveWorkItemPackGeneric` uses database transactions with `orderBy(desc(version))` to ensure correct version incrementing even under concurrent regenerations
- **API Endpoints**: Auto-registered routes at `/api/work-items/:id/{pack-endpoint-suffix}` with Zod validation and error handling

Recent improvements (November 2025):
- Fixed critical bug where pack regenerations were updating rows instead of inserting new versions
- Aligned all 14 skill JSON prompts with their Zod schemas to eliminate LLM validation failures
- Updated prompts with **CRITICAL: YOU MUST RETURN VALID JSON** instructions and comprehensive examples
- Verified e2e pack generation with proper version history (agent_governance v1, pricing_monetization v1/v2/v3)
- **November 14, 2025**: Fixed pack generation persistence bugs:
  - Added missing imports (`eq`, `desc` from drizzle-orm, `workItemPacks` from schema) to server/routes.ts
  - Removed invalid `updatedAt` field from `saveWorkItemPackGeneric` function (schema only has `createdAt`)
  - Fixed route registration path mismatch: backend now correctly registers `/api/work-items/:id/actions/${endpointSuffix}` to match frontend calls
  - Verified end-to-end pack generation with automated testing: lifecycle pack v1/v2 successfully created and displayed in WorkItemPacksPanel

The CI/CD pipeline uses GitHub Actions for automated testing and environment health validation. Production health checks include `/api/healthz` (readiness) and `/api/healthz/livez` (liveness) endpoints, with Prometheus metrics and deployment tracking for observability.

### Technology Stack
The frontend utilizes React 18, TypeScript, Wouter, TanStack Query v5, React Hook Form, Zod, Shadcn UI, and Tailwind CSS. The backend is built with Express.js, TypeScript, and Drizzle ORM. PostgreSQL, backed by Neon, serves as the primary database.

### Database Schema
Core tables include agents, agent_specs, projects, tasks, ideas, decisions, business_units, knowledge_items, work_orders, operations_events, and brand_products. E-commerce tables include affiliates, aff_clicks, aff_attributions, inventory_products, and inventory_events. Operational configuration tables include ops_settings and ops_settings_audit (with triggers for automatic audit logging). File attachment tables include work_item_files for S3-backed file storage.

### Authentication & Security
Authentication is provided by Replit Auth (OpenID Connect). The security architecture employs a dual authentication system (session-based and API token auth) and a Helmet-based Content Security Policy (CSP). Role-Based Access Control (RBAC) is implemented for operational roles (ops_viewer, ops_editor, ops_admin) with server-side enforcement and client-side role gating. Scope-Based Authorization uses `requireScopes()` middleware. Rate limiting and idempotency protection are also enforced.

### CI/CD & Deployment
A GitHub Actions CI Pipeline automates testing, type-checking, and environment health validation. An Environment Health Script (`scripts/check-env.ts`) validates required environment variables.
The staging environment features comprehensive testing infrastructure with multiple authentication options, isolated resources, production-ready health check endpoints, and automated smoke testing.

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