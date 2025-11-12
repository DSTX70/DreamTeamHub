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

Core operational systems include a Universal Search (Cmd+K), auto-generating Breadcrumb Navigation, and an Operations Events Logging system for telemetry and audit trails. Knowledge management is supported by a Knowledge Publishing System with database-level idempotency and Google Drive Integration. A Work Orders System enables real LLM execution via OpenAI, Anthropic, and Vertex AI with budget caps, rate limiting, and cost tracking, supported by an LLM Provider Infrastructure.

The platform also features an Alert Notification System, an Evidence Pack System for agent training evidence management, and an Academy Sidebar. A Two-Reviewer Publish Workflow ensures content approval. An Ops Dashboard & Observability provides real-time operational metrics, including an Ops Overview Dashboard for unified operational command.

Completed e-commerce features include Affiliate E2E Tracking, Affiliate Rates & Payouts, Inventory Notification Overrides, Low-Stock Inventory Scheduler, and an Ops Settings UI. Responsive Images with S3 integration and client-side LLM Prompt Linter are also implemented.

A Hybrid Uploader Configuration System provides runtime-editable file upload settings with environment-locked sensitive settings (storage backend) and database-stored operational settings (allowlist, size limits, visibility) with full audit trail and ops_admin RBAC protection. Includes comprehensive automated testing infrastructure (backend validation tests, audit trail monitoring utilities, and e2e test specifications), Audit Trail page at `/ops/audit` for real-time config change monitoring with trigger verification, summary statistics, and filterable records.

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