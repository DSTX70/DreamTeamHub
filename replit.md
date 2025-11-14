# Dream Team Hub

## Overview
Dream Team Hub is a multi-pod orchestration platform designed to unify management, reduce redundancy, synchronize actions, and enhance collaboration across various organizational units for distributed teams. It provides a "single pane of glass" for comprehensive operational oversight and improved team efficiency through modules for priority management, assignments, escalations, brainstorming, audits, decisions, and an AI-powered chat system with role-based personas. The platform aims to streamline operations, foster innovation, and increase overall team productivity.

## User Preferences
I prefer detailed explanations of new features and significant changes. Please ask for my approval before making any major architectural changes or introducing new external dependencies. I value iterative development with clear communication at each step.

## System Architecture
Dream Team Hub is a full-stack application emphasizing a professional and usable design inspired by Linear and Notion, built with a clear separation of concerns.

### UI/UX Decisions
The design system is professional, inspired by Linear and Notion, utilizing Shadcn UI with Radix UI primitives. It features Inter, JetBrains Mono, and Space Grotesk fonts, a blue-based professional color scheme with a global dark theme, glass-morphism aesthetics, custom brand colors, and 21 pod-specific colors. The design follows a mobile-first approach with WCAG AAA accessibility standards. The platform supports multi-brand theming with the Fab Card Co (FCC) brand fully integrated via a design token pipeline and a `BrandScope` component.

### Technical Implementations
The platform includes core modules for operational oversight (Control Tower), dedicated Business Unit Home Pages, and comprehensive Project management. Key features include a global Idea Spark, a Role Cards System with RACI Matrix integration, and the Agent Lab Academy for role management.

AI-powered features consist of Brainstorm Studio (LLM-assisted ideation), Dream Team Chat (OpenAI GPT-4 with 32 role-based personas, context awareness, and multi-participant conversations with pod expansion), and DTH Copilot (AI assistant with OpenAI tool-calling and analytics). The chat system supports multi-participant conversation creation, automatically expanding pods into individual members.

Core operational systems include Universal Search (Cmd+K), auto-generating Breadcrumb Navigation, Operations Events Logging, and a Knowledge Publishing System with Google Drive Integration. A Work Orders System enables real LLM execution via OpenAI, Anthropic, and Vertex AI with budget caps and cost tracking.

The platform also features an Alert Notification System, an Evidence Pack System, an Academy Sidebar, a Two-Reviewer Publish Workflow, and an Ops Dashboard & Observability. E-commerce features include Affiliate E2E Tracking, Inventory Notification Overrides, and a Low-Stock Inventory Scheduler. Responsive Images with S3 integration and a client-side LLM Prompt Linter are implemented.

An SEO Alt Text CSV Pipeline allows ops admins to import image accessibility metadata, storing it in a database and providing query endpoints and an Ops UI. A Hybrid Uploader Configuration System provides runtime-editable file upload settings with environment-locked sensitive settings and database-stored operational settings, including MIME type validation. A Work Order File Linkage System connects work_orders to work_items for file management, providing WO-scoped views while anchoring files to work_items.

An AI-Powered Pack Generation System provides a config-driven mechanism for generating 20+ specification pack types across various categories (Brand/Creative, Governance, Operations, Partnerships, Data, Expansion). This system uses a registry architecture, automatically wiring routes, handlers, schemas, skills, and exports. Each pack utilizes OpenAI GPT-4 with schema-aligned JSON prompts. Packs are versioned in the database, and the system includes dual export capabilities (custom DOCX and generic DOCX converters) and Google Drive Integration for seamless publishing.

A Lifestyle Hero Image Generation System (`POST /api/work-items/:id/generate-lifestyle-heroes`) automates creation of hero images from existing Lifestyle Pack v2 data. The system uses OpenAI DALL-E-3 HD to generate master images (1792x1024) based on shot_board specifications, then crops/resizes using Sharp to Desktop (1920x800), Tablet (960x600), and Mobile (1080x1350) dimensions. Images are uploaded to S3 with exact filenames from the pack's export_plan. The endpoint supports dual authentication (session + API token), conditional RBAC for session users (ops_admin, design_pod, admin), and includes dryRun mode for planning and overwrite flag for regeneration. Ops events are logged for auditing actual generations (dry runs excluded). The UI includes a "Generate Lifestyle Hero Images" button in the Work Item Actions panel with comprehensive error handling and dynamic success toasts showing created/skipped counts and shot IDs.

The CI/CD pipeline uses GitHub Actions for automated testing and environment health validation. Production health checks include `/api/healthz` and `/api/healthz/livez` endpoints, with Prometheus metrics for observability.

### Technology Stack
The frontend utilizes React 18, TypeScript, Wouter, TanStack Query v5, React Hook Form, Zod, Shadcn UI, and Tailwind CSS. The backend is built with Express.js, TypeScript, and Drizzle ORM. PostgreSQL, backed by Neon, serves as the primary database.

### Database Schema
Core tables include agents, agent_specs, projects, tasks, ideas, decisions, business_units, knowledge_items, work_orders, operations_events, work_item_packs, and brand_products. E-commerce tables include affiliates, aff_clicks, aff_attributions, inventory_products, and inventory_events. Operational configuration tables include ops_settings and ops_settings_audit. File attachment tables include work_item_files and alt_texts.

### Authentication & Security
Authentication is provided by Replit Auth (OpenID Connect). The security architecture employs a dual authentication system (session-based and API token auth) and a Helmet-based Content Security Policy (CSP). Role-Based Access Control (RBAC) is implemented for operational roles with server-side enforcement and client-side role gating. Scope-Based Authorization uses `requireScopes()` middleware. Rate limiting and idempotency protection are also enforced.

## External Dependencies
- **OpenAI GPT-4**: Powers AI-driven conversational agents, DTH Copilot, and pack generation.
- **PostgreSQL (Neon-backed)**: Primary database for persistent data storage.
- **Replit Auth**: Provides secure user authentication.
- **Google Drive API**: Integrated for knowledge management (search, upload drafts, publish files).
- **AWS S3**: Used for responsive image storage.
- **Sharp**: Image processing library for responsive images.
- **Multer**: Handles file uploads for image processing.
- **Anthropic Claude-3.5 Sonnet**: Alternative LLM provider for Work Orders execution.
- **Vertex AI Gemini Pro**: Alternative LLM provider for Work Orders execution.
- **Slack**: Used for multi-channel alert delivery.