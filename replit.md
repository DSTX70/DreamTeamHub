# Dream Team Hub

## Overview

Dream Team Hub is a sophisticated multi-pod orchestration platform designed to provide a "single pane of glass" for managing complex organizational workflows across distributed teams. It aims to reduce redundant tasks, synchronize key actions, and facilitate evidence-grade collaboration across multiple organizational units. The platform features modules for managing priorities, assignments, escalations, brainstorming, audits, decisions, and an AI-powered chat system with role-based personas.

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