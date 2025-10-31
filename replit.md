# Dream Team Hub

**A comprehensive multi-pod orchestration platform** for managing complex organizational workflows across distributed teams.

## Overview

Dream Team Hub is a sophisticated control platform designed to provide a "single pane of glass" across Pods and projects. It reduces copy/paste workflows, syncs key actions, and enables evidence-grade collaboration across multiple organizational units.

## Core Modules

### 1. Control Tower
- **Quick Start Section**: 6 action tiles for rapid activity creation:
  - New Discussion, New Brainstorm, Conduct an Audit, Start a Conversation, Continue Previous, Quick Chat
  - Smart modal dialogs with Title, Date, Purpose, Direction Prompt fields
  - Pod and Team Member multi-select with checkboxes
  - File upload capability for documents and images
  - Knowledge Base link management for canonical folders
  - Auto-navigation to Brainstorm Studio or Audit Engine after creation
- **Live Top-5 Priorities**: Real-time view of the most critical work items
- **Assignments Dashboard**: Track work assignments by pod and person
- **Escalations Monitor**: Automatically surface blocked or high-severity items
- **Stats Dashboard**: Total work items, in-progress count, blocked items, and items due this week

### 2. Role Cards System
- **Complete Roster**: Catalog all Dream Team personas with rich metadata
- **Structured Data**: Handle, title, pod, purpose, core functions, responsibilities, tone/voice, definition of done, tags, links
- **Bulk Import**: Import role cards from JSON/CSV files
- **RACI Matrix**: Track workstream responsibilities (Responsible, Accountable, Consulted, Informed)
- **Pod Filtering**: Filter and search roles by pod or handle

### 3. Brainstorm Studio
- **Quick Start Integration**: Launch sessions directly from Control Tower with full configuration
- **Structured Ideation**: Multi-pod brainstorming with defined roles (Pro, Devil's Advocate, Neutral, Customer Voice)
- **Three-Round Process**:
  - **Diverge**: Timed idea generation
  - **Cluster**: Group similar ideas with LLM assistance
  - **Score**: Rate ideas using ICE or RICE rubrics (Impact × Effort × Confidence)
- **Work Item Generation**: Convert top-rated ideas directly to work items
- **Session Management**: Track multiple brainstorm sessions with facilitators and participants

### 4. Audit Engine
- **Quick Start Integration**: Create audits directly from Control Tower with type selection
- **Cross-Pod Compliance**: Run checklists across multiple pods
- **Audit Types**:
  - Security/SOC2: Control spot-checks, SBOM, incident readiness
  - IP Readiness: Claims mapping, figure legibility, IDS/ADS
  - Brand-Lock: Palettes, typography, logo lockups, KDP/Shopify specs
  - Finance Ops: CAC/COGS snapshots, budget variance, approvals
- **Evidence Capture**: Attach evidence links and files to checks
- **Audit Packs**: Generate ZIP + INDEX.txt with SHA256 checksums
- **Findings Tracking**: Log findings with severity and recommendations

### 5. Decision Log
- **Immutable Tracking**: Permanent record of key decisions
- **Rich Metadata**: Summary, rationale, approver, effective date, status
- **Artifact Linkage**: Connect decisions to supporting documents and Drive links
- **Timeline View**: Chronological display with visual indicators
- **Cross-Reference**: Link decisions to pods and work items

### 6. Intake & Routing
- **Work Item Management**: Create and track work items with full lifecycle
- **Pod Assignment**: Route work to appropriate organizational units
- **Owner Assignment**: Assign specific team members as owners
- **Priority Levels**: Low, Medium, High, Critical
- **Status Tracking**: Todo, In Progress, Blocked, Done
- **Milestone Tracking**: Associate work with sprints or releases
- **Due Dates**: Set and track deadlines

### 7. Pods & Persons
- **Pod Management**: Organizational units with charters and owners
- **Person Management**: Team members with handles, roles, and contact info
- **Hierarchical Structure**: Link persons to pods
- **Thread IDs**: Store canonical thread IDs for Summon/Mirror-Back workflows (Phase 2)

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for client-side routing
- **TanStack Query v5** for server state management
- **React Hook Form** with Zod validation
- **Shadcn UI** components with Radix UI primitives
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **date-fns** for date formatting

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** database (Neon-backed)
- **Drizzle ORM** for type-safe database access
- **Zod** for runtime validation
- **RESTful API** design

### Database Schema
Comprehensive relational model with 15+ tables:
- Pods & Persons
- Role Cards & RACI
- Work Items
- Decisions
- Brainstorm Sessions, Participants, Ideas, Clusters, Artifacts
- Audits, Checks, Findings, Artifacts
- Events (audit trail)

## Design System

Following **Linear + Notion** inspired design principles:
- **Typography**: Inter for UI, JetBrains Mono for code/IDs
- **Color Palette**: Professional blue-based scheme with semantic colors
- **Spacing**: Consistent 2/4/6/8 unit system
- **Components**: Shadcn UI with custom elevation system (hover-elevate, active-elevate-2)
- **Responsive**: Mobile-first with md/lg/xl breakpoints
- **Accessibility**: ARIA labels, keyboard navigation, proper focus states

## API Structure

All routes prefixed with `/api`:

### Control Tower
- `GET /api/control/dashboard` - Dashboard data (top-5, assignments, escalations, stats)

### Pods & Persons
- `GET /api/pods` - List all pods
- `POST /api/pods` - Create pod
- `GET /api/persons` - List all persons
- `POST /api/persons` - Create person

### Role Cards
- `GET /api/roles` - List role cards (filterable by pod/handle)
- `POST /api/roles` - Create role card
- `POST /api/roles/import` - Bulk import from JSON
- `GET /api/roles/:id` - Get single role card
- `PUT /api/roles/:id` - Update role card
- `DELETE /api/roles/:id` - Delete role card

### RACI
- `GET /api/roles/raci` - List RACI entries (filterable by workstream/role)
- `POST /api/roles/raci` - Create RACI entry

### Work Items
- `GET /api/work-items` - List work items
- `POST /api/work-items` - Create work item
- `PUT /api/work-items/:id` - Update work item
- `DELETE /api/work-items/:id` - Delete work item

### Decisions
- `GET /api/decisions` - List decisions
- `POST /api/decisions` - Create decision

### Brainstorm Sessions
- `GET /api/brainstorm/sessions` - List sessions
- `POST /api/brainstorm/sessions` - Create session
- `GET /api/brainstorm/sessions/:id` - Get session details
- `POST /api/brainstorm/sessions/:id/ideas` - Add idea
- `POST /api/brainstorm/sessions/:id/clusters` - Create cluster
- `POST /api/brainstorm/sessions/:id/score` - Score ideas
- `POST /api/brainstorm/sessions/:id/commit` - Generate work items

### Audits
- `GET /api/audits` - List audits
- `POST /api/audits` - Create audit
- `GET /api/audits/:id` - Get audit details
- `POST /api/audits/:id/checks` - Add check
- `PUT /api/audits/:id/checks/:checkId` - Update check status
- `POST /api/audits/:id/findings` - Add finding
- `POST /api/audits/:id/pack` - Generate audit pack (ZIP + INDEX.txt)

## Seed Data

**Includes 33 role cards** covering the complete Dream Team:
- Control Tower: OS (Orchestrator)
- IP & Patent: Aegis, Atlas, Patent Illustrator, IP Paralegal/Docketing, Archivist
- Security: Sentinel, Coda, Praetor, Dr. Rowan Vagus, Avery Marlowe
- Brand & Assets: Nova
- Marketing: Prism, Storybloom, Echo, Beacon, Kaoru Arai, Izumi Takahashi, English Poet, English Lyricist
- Finance: Ledger, Amani
- Product & Engineering: Lume, Forge, LexiCode, CodeBlock, App Development Guru, Foundry, Conductor, Pulse, Bridge, Verifier

## Development Workflow

1. **Schema**: All data models defined in `shared/schema.ts`
2. **Storage Interface**: `server/storage.ts` defines IStorage interface
3. **Database Implementation**: DatabaseStorage implements IStorage using Drizzle
4. **API Routes**: `server/routes.ts` registers all endpoints
5. **Frontend Components**: Pages in `client/src/pages/`, shared components in `client/src/components/`
6. **Type Safety**: Full TypeScript coverage from database to UI

## Future Enhancements (Phase 2)

- **Google Drive Integration**: Automated artifact sync with SHA256 checksums (Note: Requires Replit Google Drive connector setup - user dismissed initial setup flow)
- **OpenAI Integration**: Auto-clustering for Brainstorm Studio, decision summaries
- **Summon/Mirror-Back**: Post updates to pod canonical threads via chat APIs
- **One-Click Kits**: Attorney Packet, A+ Content Kit, Brand-Lock Pack with INDEX.txt
- **Advanced Validators**: KDP image specs, Shopify asset rules, figure legibility @66%
- **RBAC**: Admin/Pod Lead/Contributor/Viewer roles with JWT auth

## Current Status

**Phase 1 Complete**: Full-stack MVP deployed with all core modules functional
- PostgreSQL database with complete schema (15+ tables)
- RESTful API with 50+ endpoints
- Professional UI with Linear + Notion inspired design
- 32 role cards imported and searchable
- 7 canonical pods seeded

**Phase 2 In Progress**: Enhanced user experience features
- ✅ Quick Start section on Control Tower dashboard
- ✅ Integrated Brainstorm Studio and Audit Engine creation flows
- ✅ Smart modal dialogs with pod/person selection and file uploads
- 🔄 OpenAI integration for auto-clustering and summaries
- 🔄 One-click Kits (Attorney Packet, A+ Content, Brand-Lock Pack)
- 🔄 Advanced audit templates with validators
