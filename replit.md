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

Core operational systems include a Universal Search (Cmd+K), auto-generating Breadcrumb Navigation, and an Operations Events Logging system for telemetry and audit trails, viewable via the Operations Logs Admin Page.

Knowledge management is supported by a Knowledge Publishing System with database-level idempotency and Google Drive Integration for Business Unit-specific content. Work Orders System enables real LLM execution via OpenAI, Anthropic, and Vertex AI with budget caps, rate limiting, and cost tracking. An LLM Provider Infrastructure integrates these services with robust error handling and cost tracking.

The platform also features an Alert Notification System for multi-channel delivery (Slack, webhooks), an Evidence Pack System for agent training evidence management, and an Academy Sidebar for agent training and promotion. A Two-Reviewer Publish Workflow ensures content approval.

An Ops Dashboard & Observability provides real-time operational metrics, displaying PUBLISH events, draft uploads, work order runs, and error rates, with lightweight alert rules.

Future phases include an Onboarding Wizard for brand/product creation, Coverage Views for role staffing analysis, and a Playbooks Registry for reusable Work Order configurations. Additional planned features encompass Saved Addresses & Checkout, Affiliate E2E Tracking, Low-Stock Inventory Scheduler, Responsive Images with S3, and a client-side Prompt Linter.

### Technology Stack
The frontend utilizes React 18, TypeScript, Wouter, TanStack Query v5, React Hook Form, Zod, Shadcn UI, and Tailwind CSS. The backend is built with Express.js, TypeScript, and Drizzle ORM. PostgreSQL, backed by Neon, serves as the primary database with a comprehensive relational model.

### Authentication & Security
Authentication is provided by Replit Auth (OpenID Connect). The security architecture employs a dual authentication system (session-based and API token auth) and a Helmet-based Content Security Policy (CSP). Scope-Based Authorization uses `requireScopes()` middleware. Routes support dual authentication via `isDualAuthenticated`. Rate limiting is enforced with `429` status and `Retry-After` headers. Idempotency protection is implemented for knowledge publish endpoints using the `Idempotency-Key` header.

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