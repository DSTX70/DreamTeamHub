# Dream Team Hub - Codebase Overview for Audit

## Project Summary
Dream Team Hub by i³ collective - A comprehensive multi-pod orchestration platform with unified agent system (57 fully-specified agents: 37 Dream Team AI specialists + 20 pod-based roles).

## Technology Stack

### Frontend
- React 18 + TypeScript
- Wouter (routing)
- TanStack Query v5 (data fetching)
- Shadcn UI + Radix UI (components)
- Tailwind CSS (styling)
- Lucide React (icons)
- React Hook Form + Zod (forms & validation)

### Backend
- Express.js + TypeScript
- PostgreSQL (Neon-backed)
- Drizzle ORM
- Replit Auth (OpenID Connect)

### Development
- Vite (build tool)
- tsx (TypeScript execution)

## Architecture

### Database Schema (24 tables)
Located in: `shared/schema.ts`

Key tables:
- **users** - Replit Auth user data
- **sessions** - Session storage for auth
- **agents** - Unified 57-agent system (Dream Team + Pod Roles)
- **pods** - Organizational units (16 pods)
- **projects** - Project management with pillar organization
- **projectFiles** - File management with review workflow
- **projectAgents** - Many-to-many agent assignments
- **projectPods** - Many-to-many pod assignments
- **projectTasks** - Task management
- **projectMessages** - Project messaging
- **roleCards** - Dream Team personas
- **agentSpecs** - Agent specifications
- **conversations** - Chat system
- **messages** - Chat messages
- **agentMemories** - Agent memory system
- **agentRuns** - Agent execution logs
- **workItems** - Intake & routing system
- **priorityItems** - Priority tracking
- **escalations** - Issue escalation
- **brainstormSessions** - Ideation sessions
- **ideas** - Ideas from brainstorming
- **audits** - Compliance audits
- **auditArtifacts** - Audit evidence
- **decisions** - Decision log
- **events** - System events

### Frontend Structure
```
client/src/
├── App.tsx - Main app with routing and auth
├── pages/ - 18 pages
│   ├── landing.tsx - Public landing page
│   ├── control-tower.tsx - Dashboard
│   ├── roles.tsx - Agent roster (57 agents)
│   ├── agent-create.tsx - NEW: Agent creation form
│   ├── agent-console.tsx - Agent interaction
│   ├── projects.tsx - Project management
│   ├── project-create.tsx - Project creation
│   ├── pods.tsx - Pod management
│   ├── chat.tsx - AI chat with 32 personas
│   ├── brainstorm.tsx - Ideation studio
│   ├── audits.tsx - Audit engine
│   ├── decisions.tsx - Decision log
│   ├── intake.tsx - Work item intake
│   ├── summon-mirror.tsx - Mirror-Back system
│   ├── roster-admin.tsx - Roster management
│   ├── role-agent-sync.tsx - Role ⇄ Agent sync
│   ├── brand-guide.tsx - Design system
│   └── help.tsx - Help page
├── components/
│   ├── ui/ - Shadcn UI components
│   ├── app-sidebar.tsx - Navigation sidebar
│   ├── empty-state.tsx - Empty state component
│   ├── AutonomySelect.tsx - NEW: Autonomy level selector
│   └── RosterAdmin.tsx - Roster admin component
├── hooks/
│   ├── useAuth.ts - Authentication hook
│   └── use-toast.ts - Toast notifications
└── lib/
    └── queryClient.ts - TanStack Query setup
```

### Backend Structure
```
server/
├── index.ts - Express server entry
├── routes.ts - API routes (~1000 lines)
├── storage.ts - Database interface & implementation
├── vite.ts - Vite dev server integration
└── auth.ts - Replit Auth setup
```

### Shared Types
```
shared/
└── schema.ts - Database schema & Zod validators (838 lines)
```

## Key Features

### 1. Projects System
- Organized by business pillars (Imagination, Innovation, Impact)
- Multi-select pod/agent assignments
- Task management
- File management with review workflow
- Project messaging
- Full CRUD capabilities

### 2. Agent System (57 agents)
- 37 Dream Team AI specialists
- 20 pod-based roles
- Complete Skill Pack metadata for each
- Autonomy levels: L0 (Advisor) → L3 (Orchestrator)
- NEW: Agent creation form at /agents/new

### 3. Dream Team Chat
- AI-powered conversational interface
- 32 role-based personas using OpenAI GPT-4
- Context-aware responses
- Agent memory system

### 4. Control Tower
- Dashboard with priorities, assignments, escalations
- Real-time statistics

### 5. Brainstorm Studio
- Structured ideation with LLM-assisted clustering
- Idea scoring

### 6. Audit Engine
- Cross-pod compliance checks
- Evidence capture

### 7. Decision Log
- Immutable record of key decisions

### 8. Intake & Routing
- Work item lifecycle management

## Design System

### Brand Colors
- Teal (#0FA3B1)
- Violet (#6F5AE8)
- Yellow (#F4D35E)
- Magenta (#E23D8A)
- Jade (#17C3B2)
- Plus 11 pod-specific colors

### Typography
- Space Grotesk (headings)
- Inter (body)
- JetBrains Mono (code)

### Theme
- Global dark theme
- Glass-morphism aesthetics
- Professional design inspired by Linear + Notion
- Custom elevation system
- Branded primitive components

## Authentication
- Replit Auth (OpenID Connect)
- Supports Google, GitHub, Apple, X, email/password
- Session-based with PostgreSQL storage
- All API routes protected with isAuthenticated middleware

## Recent Changes (Latest Session)
1. Fixed pillar-specific project pages - dynamic titles and context-aware stats
2. Created AutonomySelect component
3. Built Agent Create form at /agents/new
4. Enabled "Add Agent" button on roles page
5. E2E tested agent creation flow - PASSED

## API Endpoints (Key Routes)

### Auth
- GET /api/auth/user - Get current user
- POST /api/auth/login - Initiate login
- GET /api/logout - Logout

### Agents (NEW endpoints)
- GET /api/agents - List all 57 agents
- POST /api/agents - Create new agent
- PUT /api/agents/:id - Update agent
- DELETE /api/agents/:id - Delete agent

### Projects
- GET /api/projects - List projects (with filters)
- POST /api/projects - Create project
- GET /api/projects/:id - Get project details
- PUT /api/projects/:id - Update project
- DELETE /api/projects/:id - Delete project

### Project Files
- GET /api/projects/:id/files - List files
- POST /api/projects/:id/files - Upload file
- PUT /api/projects/:projectId/files/:fileId - Update file
- DELETE /api/projects/:projectId/files/:fileId - Delete file

### Chat
- GET /api/conversations - List conversations
- POST /api/conversations - Create conversation
- POST /api/conversations/:id/messages - Send message

### More: pods, role-cards, brainstorm, audits, decisions, intake, etc.

## Known Issues
- 27 LSP diagnostics in shared/schema.ts (boolean type assignments, lines 695-836)

## Testing
- E2E testing with Playwright
- Latest test: Agent creation flow - PASSED
  - Created agent_test_Tdrqgc
  - Verified redirect and search functionality
  - Confirmed type and pillar display

## File Statistics
Total export size: 21MB (compressed, excludes node_modules)

## Environment Variables Required
- DATABASE_URL - PostgreSQL connection
- OPENAI_API_KEY - For AI chat
- SESSION_SECRET - Session encryption
- PG* variables - Database credentials

## Documentation
- replit.md - Project overview and user preferences
- design_guidelines.md - Frontend design specifications

---
Generated: $(date)
