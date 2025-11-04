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

### Technology Stack
- **Frontend**: React 18, TypeScript, Wouter, TanStack Query v5, React Hook Form, Zod, Shadcn UI, Tailwind CSS.
- **Backend**: Express.js, TypeScript, Drizzle ORM.
- **Database**: PostgreSQL (Neon-backed) with a comprehensive relational model (25 tables).

### Authentication & Security
- **Authentication Provider**: Replit Auth (OpenID Connect).
- **Security Architecture**: Dual authentication system with session-based auth for interactive users and API token auth for external integrations/CI/CD.

## External Dependencies

- **OpenAI GPT-4**: Powers the AI-driven conversational agents in Dream Team Chat.
- **PostgreSQL (Neon-backed)**: Primary database for persistent storage.
- **Replit Auth**: Provides secure user authentication via OpenID Connect.