# Dream Team Hub Platform Audit Export
**Generated:** November 5, 2025  
**Version:** Production v2025Q4  
**Purpose:** Comprehensive platform review for ChatGPT Dream Team audit

---

## Executive Summary

Dream Team Hub is a multi-pod orchestration platform featuring:
- **57 fully-specified agents** across 22 pods
- **Dual authentication** (Session + API Token for CI/CD)
- **AI-powered features**: Dream Team Chat (32 personas), DTH Copilot, Brainstorm Studio
- **Project management** with agent assignments and task tracking
- **Work Orders** system for automated agent task execution
- **External integrations** via REST API with OpenAPI spec

---

## System Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript, Wouter, TanStack Query v5, Shadcn UI, Tailwind CSS
- **Backend**: Express.js + TypeScript, Drizzle ORM
- **Database**: PostgreSQL (Neon-backed) with 26 tables
- **Authentication**: Replit Auth (OIDC) + API Token (Bearer)
- **AI Services**: OpenAI GPT-4 for chat and copilot features

### Database Schema Overview (26 Tables)

#### Core Tables
1. **users** - Replit Auth user profiles
2. **sessions** - Express session storage
3. **pods** (22 records) - Organizational units with color coding
4. **persons** - Team members and stakeholders
5. **role_cards** (57 records) - Agent Lab role definitions
6. **role_raci** - RACI matrix for workstreams
7. **agents** - Unified agent registry (Dream Team + Pod roles)
8. **agent_specs** - Technical specifications synced from role cards

#### Orchestration Tables
9. **work_items** - Priority management and assignments
10. **decisions** - Immutable decision log
11. **idea_sparks** - Quick idea capture with smart filtering
12. **events** - System-wide event tracking

#### Projects Module
13. **projects** - Project management with 3 pillars (Imagination, Innovation, Impact)
14. **project_files** - Deliverables and documentation
15. **project_pods** - Multi-pod assignments
16. **project_agents** - Agent assignments to projects
17. **project_tasks** - Task breakdown and tracking
18. **project_messages** - Project-specific communications

#### Collaboration Tools
19. **conversations** - Dream Team Chat sessions
20. **messages** - Chat message history
21. **agent_memories** - Context retention for AI agents
22. **agent_runs** - Execution logs for agent interactions
23. **brainstorm_sessions** - Ideation sessions
24. **brainstorm_ideas** - Generated ideas
25. **brainstorm_clusters** - Idea groupings

#### Audit & Quality
26. **audits** - Compliance and quality audits
27. **audit_checks** - Individual audit items
28. **audit_findings** - Audit results
29. **agent_goldens** - Nightly snapshots of agent KPIs

---

## API Endpoints

### Authentication
- **Session Auth**: Replit Auth login at `/api/login`
- **API Token**: Bearer token in `Authorization` header
- **Dual Auth**: Supports both methods for flexibility

### Public Endpoints
- `GET /healthz` - Health check (no auth)

### Core Resources (Session Auth Required)
- `GET /api/auth/user` - Current user profile
- `GET /api/pods` - List all pods
- `GET /api/control/dashboard` - Dashboard metrics
- `GET /api/projects` - List projects (supports filtering)
- `GET /api/idea-sparks` - List idea sparks

### Role Cards API (Dual Auth)
- `GET /api/roles` - List all role cards (pagination supported)
- `GET /api/roles/by-handle/{handle}` - Get role by handle
- `POST /api/roles` - Create role card (API token only)
- `PUT /api/roles/by-handle/{handle}` - Update role (API token only)

### Agents API (Dual Auth)
- `GET /api/agents/summary` - Agent summaries with KPIs
  - Query params: `bu`, `level`, `status`, `q`, `limit`, `offset`
  - Returns: display_name, autonomy_level, status, next_gate, KPIs (task_success, latency_p95_s, cost_per_task_usd)

### Work Orders (Session Auth)
- `GET /api/work-orders` - List work orders
- `POST /api/work-orders` - Create work order
- `GET /api/work-orders/runs` - List execution runs
- `POST /api/work-orders/:woId/start` - Start simulated run

### Copilot (Session Auth)
- `POST /copilot/ask` - AI assistant queries
  - Direct tool calling: `{tool: "smokeTest"|"getAgentSummaries"|"listRoles", params: {...}}`
  - Chat mode: `{message: "natural language query"}`
  - Rate limit: 30 requests/min per user

---

## Key Features

### 1. DTH Copilot
- **Quick Actions**: Smoke Test, Agent Summaries, Role Queries
- **Analytics**: "Findings at a Glance" with risk distribution, KPIs, actionable insights
- **Rate Limiting**: 30 req/min per user
- **Logging**: Structured JSON logs `{user_id, path, tool, status, ms}`

### 2. Work Orders System
- **File-based storage**: JSON files in `/data` directory
- **Templates**: Pre-configured for Support L1, Marketing L1
- **Simulation**: Draft-only runs with cost/latency metrics
- **Auto-polling**: UI updates every 5-8 seconds

### 3. Dream Team Chat
- **32 Personas**: Role-specific AI agents with context awareness
- **Memory**: Agent memories with semantic scoring
- **Runs Tracking**: Execution logs for all interactions

### 4. Projects Module
- **3 Pillars**: Imagination, Innovation, Impact
- **Multi-pod assignments**: Projects span multiple pods
- **Agent assignments**: Link agents to projects
- **Task management**: Breakdown with status tracking
- **File management**: Upload/review deliverables

### 5. Brainstorm Studio
- **LLM-powered**: GPT-4 assisted ideation
- **Clustering**: Auto-group related ideas
- **Artifacts**: Export session outputs

---

## Security & Access Control

### Authentication Methods
1. **Replit Auth (OIDC)**: Web UI sessions
2. **API Token**: CI/CD and external integrations
   - Secret: `DTH_API_TOKEN`
   - Format: `Authorization: Bearer <token>`

### Staging Environment Protection
- **Basic Auth**: Username/password gate
- **IP Allowlist**: CIDR notation support
- **Environment**: `NODE_ENV=staging`

### Secrets Management
- `DATABASE_URL` - PostgreSQL connection
- `OPENAI_API_KEY` - GPT-4 access
- `DTH_API_TOKEN` - API authentication
- `SESSION_SECRET` - Session encryption

---

## Data Model Highlights

### Pod Color Coding System
21 unique colors via `data-pod` attribute:
- Accessibility: `#9B87F5`
- Analytics: `#7E69AB`
- Brand: `#6E59A5`
- (18 more pods with distinct colors)

### Agent Autonomy Levels
- **L0**: Human-in-the-loop for every decision
- **L1**: Automated with human review (80% of current agents)
- **L2**: Full autonomy with exception handling
- **L3**: Strategic autonomy with learning

### RACI Matrix
- **R**esponsible: Executes the work
- **A**ccountable: Final authority
- **C**onsulted: Provides input
- **I**nformed: Kept updated

---

## Integration Points

### External API
- **OpenAPI 3.0 Spec**: `/docs/API_SPEC_v0.1.1.yaml`
- **GPT Actions Schema**: `/docs/GPT_ACTIONS_SCHEMA.yaml`
- **Postman Collection**: `/docs/POSTMAN_COLLECTION.json`

### CI/CD Integration
- **GitHub Actions**: Role card imports from Agent Lab repository
- **Webhook Support**: `/api/roles` POST endpoint
- **Staging Refresh**: Weekly Monday 07:00 UTC with PII masking

---

## Performance & Monitoring

### Rate Limits
- Copilot: 30 requests/min per user
- Returns `429` with `reset_in_s` when exceeded

### Logging
- Structured JSON for all Copilot requests
- Request tracking: `{user_id, path, tool, status, ms, error?}`

### Cron Jobs
- **Nightly Agent Snapshots**: 2:00 AM daily
- **Staging DB Refresh**: Mondays 07:00 UTC

---

## File Structure

### Backend (`server/`)
- `index.ts` - Express app entry point
- `routes.ts` - Main API routes (2000+ lines)
- `storage.ts` - Database abstraction layer
- `work_orders.ts` - Work orders file-based storage
- `copilot.ts` - AI assistant logic
- `openai-service.ts` - GPT-4 integration
- `agent-context.ts` - Memory & context management
- `replitAuth.ts` - OIDC authentication
- `middleware/stagingGuard.ts` - Environment protection

### Frontend (`client/src/`)
- `App.tsx` - Router and layout
- `pages/` - 20+ page components
- `components/` - Reusable UI components
- `components/ui/` - Shadcn component library
- `lib/queryClient.ts` - TanStack Query setup

### Configuration
- `shared/schema.ts` - Drizzle ORM schema (900+ lines)
- `drizzle.config.ts` - Database configuration
- `vite.config.ts` - Build configuration
- `tailwind.config.ts` - UI styling system

---

## Known Limitations & Technical Debt

1. **Work Orders**: File-based storage (should migrate to PostgreSQL for production)
2. **LSP Diagnostics**: 65 warnings in schema.ts and storage.ts (type imports)
3. **Polling**: Work Orders UI uses polling instead of WebSockets
4. **Mock Runs**: Work order execution is simulated (no real agent execution)

---

## Recommendations for Audit

### Critical Areas
1. **Security Review**: Validate dual auth implementation
2. **Data Integrity**: Check foreign key constraints
3. **Performance**: Review database indexes
4. **Error Handling**: Audit error boundaries and fallbacks
5. **Rate Limiting**: Verify Copilot throttling effectiveness

### Enhancement Opportunities
1. **Work Orders**: Migrate from file storage to PostgreSQL
2. **Real-time Updates**: Implement WebSockets for live updates
3. **Caching**: Add Redis for frequently accessed data
4. **Testing**: Expand e2e test coverage
5. **Documentation**: Auto-generate API docs from code

---

## Contact & Support

- **Platform**: Dream Team Hub by i³ collective
- **Environment**: Development (Replit)
- **Database**: PostgreSQL (Neon)
- **Deployment**: Replit Autoscale Deployments
- **Documentation**: `/docs/` directory

---

**End of Platform Audit Export**
