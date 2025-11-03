# Dream Team Hub User Manual
## By i³ collective

**Version 1.0** | Last Updated: November 2025

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard](#dashboard)
4. [Orchestration](#orchestration)
   - [Intake & Routing](#intake--routing)
   - [Decision Log](#decision-log)
5. [Collaboration](#collaboration)
   - [Dream Team Chat](#dream-team-chat)
   - [Agent Console](#agent-console)
   - [Summon & Mirror](#summon--mirror)
   - [Brainstorm Studio](#brainstorm-studio)
   - [Audit Engine](#audit-engine)
6. [Foundation](#foundation)
   - [Pods & Persons](#pods--persons)
   - [Role Cards](#role-cards)
   - [Roster Admin](#roster-admin)
   - [Roles ⇄ Specs Sync](#roles--specs-sync)
7. [User Settings](#user-settings)
8. [Tips & Best Practices](#tips--best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Glossary](#glossary)

---

## Introduction

### What is Dream Team Hub?

Dream Team Hub is a sophisticated multi-pod orchestration platform designed to provide a "single pane of glass" for managing complex organizational workflows across distributed teams. The platform aims to reduce redundant tasks, synchronize key actions, and facilitate evidence-grade collaboration across multiple organizational units.

### Key Benefits

- **Unified Command Center**: Manage all organizational activities from one centralized dashboard
- **AI-Powered Assistance**: 32 role-based AI personas provide contextual help and intelligent responses
- **Evidence-First Design**: Audit-grade tracking with comprehensive evidence capture
- **Multi-Pod Coordination**: Seamless collaboration across organizational units
- **Structured Workflows**: Brainstorming, auditing, decision-making, and routing in one platform

### Platform Philosophy

Dream Team Hub follows an **evidence-first, audit-grade** approach with:
- Calm, professional aesthetics
- Clear visual hierarchy with pod-specific color coding
- Accessibility-first design (WCAG AAA compliance)
- Glass-morphism UI for modern, elegant experience

---

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge - latest versions)
- Internet connection
- Screen resolution: 1280x720 minimum (responsive up to 4K)

### First Login

1. Navigate to your Dream Team Hub instance URL
2. The dashboard will load automatically
3. Use the sidebar navigation (☰) to explore different modules
4. Start with the Dashboard to get an overview of your organization

### Navigation

The application features a collapsible sidebar with four main sections:

**Dream Team Hub by i³ collective**
- Dashboard

**Orchestration**
- Intake & Routing
- Decision Log

**Collaboration**
- Dream Team Chat
- Agent Console
- Summon & Mirror
- Brainstorm Studio
- Audit Engine

**Foundation**
- Pods & Persons
- Role Cards
- Roster Admin
- Roles ⇄ Specs Sync
- Brand Guide

### Understanding Pod Colors

The platform uses 21 distinct pod colors to help you quickly identify functional areas. Each pod has a unique color that appears on agent cards, filter buttons, and throughout the interface:

| Pod | Hex Code | Description |
|-----|----------|-------------|
| Retail Collective Pod (RCP) | #2EC5C2 | Retail operations and strategy |
| Social & Influence CoE (SICoE) | #6F5AE8 | Social media and influencer management |
| Creative Pod | #C95CAF | Creative content and design |
| Product & Platform Pod | #0FA3B1 | Product development and engineering |
| IP/Patent Program Pod | #FF7A1A | Intellectual property management |
| Security & Compliance Pod | #E4572E | Security audits and compliance |
| Marketing & PR Pod | #FFD449 | Marketing and public relations |
| Ops & Finance Pod | #1A1A1A | Operations and financial management |
| Cultural Pod | #34AABB | Cultural initiatives and diversity |
| Impact Programs Office (IPO) | #E24F8A | Impact and sustainability programs |
| Education & Cohorts Pod | #5CB85C | Educational programs and training |
| Accessibility & Captioning Pod | #007ACC | Accessibility and content captioning |
| Packaging & Pre-Press Pod | #D4AF37 | Packaging design and pre-press |
| WMS / 3PL Ops Pod | #7A6FF0 | Warehouse and logistics operations |
| Channel Integrations Pod | #50C3B8 | Integration and channel management |
| Author Platform Studio | #8C2E3F | Author tools and platforms |
| Music Rights & Distribution Pod | #6B1E9C | Music licensing and distribution |
| Agent Governance Pod | #FF9B28 | AI agent oversight and governance |
| Tenant & Billing Pod | #2E86DE | Tenant management and billing |
| GlobalCollabs Partnerships Pod | #F45B69 | Global partnerships and collaborations |
| Data Stewardship & Metrics Pod | #2F9E44 | Data governance and analytics |

**Visual Indicators**: Pod colors appear as:
- Colored rail on the left edge of agent cards
- Pod-colored chips/badges next to agent names
- Highlighted filter buttons when selecting pods
- Background accents in pod-specific views

---

## Dashboard

### Overview

The Dashboard (also called "Control Tower") is your central command center, providing at-a-glance visibility into:
- Live priorities
- Current assignments
- Active escalations
- Quick actions
- Key statistics

### Quick Start Section

The dashboard features 6 quick action tiles for common tasks:

1. **New Discussion** - Start a conversation with AI personas
2. **New Brainstorm** - Launch an ideation session
3. **Conduct an Audit** - Begin a compliance check
4. **Start a Conversation** - Open Dream Team Chat
5. **Continue Previous** - Resume your last activity
6. **Quick Chat** - Fast AI assistance

**Tip**: Hover over each tile to see what it does before clicking.

### Statistics Cards

Monitor your organization's health with real-time metrics:
- Total work items
- Active decisions
- Pending approvals
- Pod activity levels

**Color-coded status indicators**:
- **Green**: Healthy/on-track
- **Yellow**: Needs attention
- **Red**: Critical/overdue

### Using the Dashboard

**To access quick actions:**
1. Click any of the 6 action tiles
2. Fill in the required information in the modal dialog
3. Submit to create the item
4. You'll be redirected to the appropriate module

**To view live priorities:**
1. Scroll to the "Live Priorities" section
2. Items are sorted by priority (P0 = highest)
3. Click any item to view details
4. Use filters to narrow down the list

---

## Orchestration

### Intake & Routing

**Purpose**: Manage the complete lifecycle of work items from creation to completion.

#### Features

**Work Item Creation**
- Create new tasks, features, bugs, or initiatives
- Assign to specific pods and owners
- Set priority levels (P0-P3)
- Define milestones and due dates
- Link to related items

**Status Management**
- Track items through workflow stages
- Visual status indicators (Open, In Progress, Blocked, Done)
- Automatic status transitions
- History tracking

**Filtering & Search**
- Filter by pod, status, priority, owner
- Full-text search across all fields
- Save custom filter views
- Export filtered lists

#### How to Create a Work Item

1. Navigate to **Intake & Routing**
2. Click **+ New Item** button
3. Fill in required fields:
   - **Title**: Clear, descriptive name
   - **Description**: Detailed context and requirements
   - **Pod**: Which organizational unit owns this
   - **Priority**: P0 (Critical) to P3 (Low)
   - **Owner**: Person responsible
   - **Due Date**: Target completion date
4. Optional fields:
   - Backup owner
   - Related items
   - Tags
   - Milestones
5. Click **Create Item**

#### Work Item Lifecycle

```
Backlog → In Progress → Review → Blocked (optional) → Done → Archived
```

**Status Definitions**:
- **Backlog**: Not yet started, prioritized
- **In Progress**: Actively being worked on
- **Review**: Ready for evaluation
- **Blocked**: Waiting on dependencies
- **Done**: Completed successfully
- **Archived**: Historical record

#### Priority Guidelines

| Level | Code | Description | Response Time |
|-------|------|-------------|---------------|
| Critical | P0 | System down, data loss | Immediate |
| High | P1 | Major feature broken | < 24 hours |
| Medium | P2 | Important but not urgent | < 1 week |
| Low | P3 | Nice to have | As capacity allows |

**Tips**:
- Use P0 sparingly (< 5% of items)
- Review and re-prioritize weekly
- Include acceptance criteria in descriptions
- Link related items for context

---

### Decision Log

**Purpose**: Maintain an immutable, evidence-grade record of key organizational decisions.

#### Features

**Decision Recording**
- Capture decision title and rationale
- Record approvers and stakeholders
- Link supporting artifacts
- Tag related pods
- Timestamp and version control

**Search & Filter**
- Filter by status (Active, Pending, Archived)
- Search by keywords
- Filter by pod or approver
- Date range filtering

**Evidence Linking**
- Attach documents, diagrams, data
- Link to related work items
- Reference prior decisions
- Export decision packs

#### How to Log a Decision

1. Navigate to **Decision Log**
2. Click **+ New Decision** button
3. Enter decision details:
   - **Title**: Clear decision statement
   - **Rationale**: Why this decision was made
   - **Approvers**: Who authorized it (comma-separated)
   - **Status**: Active, Pending, or Archived
   - **Related Pods**: Which units are affected
4. Optional:
   - **Artifacts**: Upload supporting documents
   - **Related Items**: Link to work items
   - **Tags**: Add categorization
5. Click **Log Decision**

#### Decision Card Anatomy

Each decision displays:
- **Colored rail**: Indicates primary pod (yellow = Decision pod by default)
- **Icon badge**: Visual category indicator
- **Title**: Decision statement
- **Status pill**: Current state (Active/Pending/Archived)
- **Rationale**: Brief explanation
- **Meta information**: Approvers, date
- **Pod chips**: Related organizational units

#### Best Practices

**When to log a decision:**
- **YES**: Architectural choices
- **YES**: Policy changes
- **YES**: Budget allocations
- **YES**: Strategic pivots
- **YES**: Process modifications
- **NO**: Routine task assignments
- **NO**: Individual preferences
- **NO**: Temporary workarounds

**Writing good rationales:**
- Explain the problem context
- List alternatives considered
- State why this option was chosen
- Note any constraints or trade-offs
- Keep it concise (2-4 sentences)

**Example Decision Entry**:
```
Title: Adopt PostgreSQL as primary database
Rationale: After evaluating MongoDB and PostgreSQL, we chose 
PostgreSQL for its strong ACID compliance, mature ecosystem, 
and superior support for complex queries needed for audit trails.
Approvers: CTO, Lead Architect
Related Pods: Product, Security, Finance
```

---

## Collaboration

### Dream Team Chat

**Purpose**: AI-powered conversational interface with 32 role-based personas for contextual assistance.

#### Features

**32 AI Personas**
Each persona has:
- Unique role and expertise
- Specialized knowledge domain
- Consistent personality and tone
- Context-aware responses
- Learning capability through feedback

**Conversation Management**
- Create new conversations
- Continue previous chats
- Search conversation history
- Export transcripts
- Feedback system for AI improvement

**Context Awareness**
- Personas remember conversation history
- Link to related work items
- Reference organizational knowledge
- Adapt responses based on pod context

#### How to Start a Conversation

1. Navigate to **Dream Team Chat**
2. Click **+ New Conversation**
3. Select a persona from the dropdown:
   - Filter by pod or expertise
   - Read persona description
   - Choose based on your need
4. Enter your message
5. Click **Send** or press Enter
6. Continue the dialogue

#### Available Persona Types

**Strategic Roles**:
- Chief Product Officer
- Chief Technology Officer
- Chief Marketing Officer
- VP of Engineering

**Operational Roles**:
- Product Manager
- Engineering Lead
- Marketing Strategist
- Security Architect

**Specialized Roles**:
- UX Designer
- Data Analyst
- Legal Counsel
- Customer Success

**Support Roles**:
- Documentation Writer
- QA Specialist
- DevOps Engineer
- Business Analyst

#### Using Personas Effectively

**Match persona to task**:
- Product questions → Product Manager or CPO
- Technical issues → Engineering Lead or CTO
- Marketing strategy → CMO or Marketing Strategist
- Security concerns → Security Architect
- User experience → UX Designer

**Ask clear questions**:
- **GOOD**: "How should we prioritize these 5 features?"
- **GOOD**: "What security risks does this architecture have?"
- **BAD**: "Help me"
- **BAD**: "What should I do?"

**Provide context**:
- Mention relevant pod
- Reference work items
- Include constraints
- Specify desired outcome

#### Feedback System

Rate responses to improve AI:
1. After each response, click the feedback button
2. Rate 1-5 stars
3. Optionally add comments
4. Submit feedback

**Your feedback helps**:
- Improve response quality
- Tune persona personalities
- Update knowledge base
- Prioritize features

---

### Agent Console

**Purpose**: Execute tasks and teach AI agents through direct interaction and feedback.

#### Features

**Task Execution**
- Select any of the 32 agents
- Describe a task in natural language
- Run the agent and get results
- View detailed output

**Agent Training**
- Provide feedback on agent performance
- Correct misunderstandings
- Reinforce good behaviors
- Build agent memory

#### How to Run an Agent Task

1. Navigate to **Agent Console**
2. **Select Agent** dropdown:
   - Browse available agents
   - Choose one matching your task
3. **Task Description** field:
   - Describe what you need done
   - Be specific about desired outcome
   - Include any constraints
4. Click **Run Agent**
5. Wait for processing (spinner indicates activity)
6. Review output in the **Agent Output** section

#### Providing Feedback

**Quick Feedback**:
1. After viewing output, scroll to **Quick Feedback**
2. Select the same agent (or different one)
3. Type your feedback
4. Click **Send Feedback**

**Feedback types**:
- **Positive**: "Great job summarizing those requirements"
- **Corrective**: "The analysis missed the security implications"
- **Instructional**: "Next time, include cost estimates"

#### Example Agent Tasks

**Product Manager Agent**:
```
Task: Analyze these 3 feature requests and prioritize them 
based on user impact and development effort.
```

**Security Architect Agent**:
```
Task: Review this API design and identify potential 
security vulnerabilities.
```

**Documentation Writer Agent**:
```
Task: Create user-facing documentation for the new 
export feature.
```

**Tips**:
- Start with simple tasks to understand agent capabilities
- Be specific about format and depth of response
- Provide feedback regularly to improve performance
- Use consistent agents for related tasks (builds context)

---

### Summon & Mirror

**Purpose**: Post structured updates to Pod canonical threads for cross-team coordination.

#### Two-Way Communication

**Summon (Outbound)**:
Send a request to a Pod with specific asks and deliverables.

**Mirror-Back (Inbound)**:
Report back on completed work with outcomes and next steps.

#### Features

**Pod Thread Integration**
- Posts to OpenAI Threads when configured
- Falls back to console logging (safe mode)
- Maintains canonical thread per pod
- Structured message format

**Deliverable Tracking**
- Clear ask statements
- Expected deliverables
- Due dates and ownership
- Backup assignment

**Outcome Reporting**
- What was accomplished
- Links to artifacts
- Decision references
- Next steps and ownership

#### How to Post a Summon

1. Navigate to **Summon & Mirror**
2. In the **Post Summon** card (teal rail):
   - **Select Pod**: Which team you're requesting from
   - **Ask**: What you need them to do
   - **Deliverables**: Expected outputs
   - **Due**: Deadline for completion
   - **Owner**: Primary responsible person
   - **Backup**: (Optional) Secondary person
3. Click **Post Summon**
4. Confirmation toast appears
5. Message posts to pod's thread

#### How to Post a Mirror-Back

1. In the **Post Mirror-Back** card (blue rail):
   - **Select Pod**: Your pod reporting back
   - **Outcome**: What was accomplished
   - **Links**: (Optional) Add artifact URLs
     - Click **+ Add Link** for each URL
     - Remove unwanted links with X button
   - **Decision**: (Optional) Related decision made
   - **Owner/Next**: (Optional) Who handles next steps
   - **Decision Log ID**: (Optional) Link to decision entry
2. Click **Post Mirror-Back**
3. Confirmation toast appears
4. Message posts to pod's thread

#### Message Format

**Summon structure**:
```
SUMMON
Pod: [Pod Name]
Ask: [Request description]
Deliverables: [Expected outputs]
Due: [Date]
Owner: [Person]
Backup: [Person] (if any)
```

**Mirror-Back structure**:
```
MIRROR-BACK
Pod: [Pod Name]
Outcome: [What was accomplished]
Artifacts: [Links] (if any)
Decision: [Related decision] (if any)
Next: [Owner/Next steps] (if any)
Decision Log: #[ID] (if any)
```

#### OpenAI Integration

**When USE_OPENAI=1 and Pod has thread_id**:
- Messages post to OpenAI Threads
- AI can read and respond
- Full conversation history maintained
- Enables AI assistance for pods

**Otherwise**:
- Messages log to console
- Still tracked in database
- Safe fallback mode
- No external dependencies

**Tip**: Check pod configuration to see if thread integration is active (⚠️ appears if no thread configured).

---

### Brainstorm Studio

**Purpose**: Facilitate structured, multi-pod ideation sessions with AI assistance.

#### Three-Phase Process

Each brainstorm follows a structured workflow:

**1. Diverge** (Pink rail - Brand pod)
- Timed idea generation
- Assigned roles: Pro, Devil's Advocate, Neutral, Customer Voice
- Rapid-fire contributions
- No judgement phase

**2. Cluster** (Cyan rail - Product pod)
- Group similar ideas
- LLM-assisted theme identification
- Manual refinement
- Categorization and labeling

**3. Score & Commit** (Yellow rail - Decision pod)
- Rate ideas with ICE or RICE rubric
- Prioritize based on scores
- Convert top ideas to work items
- Document decisions

#### Features

**Session Management**
- Create new brainstorm sessions
- Set goals and templates
- Invite participants
- Track session status

**Role Assignment**
- Pro: Advocates for ideas
- Devil's Advocate: Challenges assumptions
- Neutral: Objective analysis
- Customer Voice: User perspective

**AI-Powered Clustering**
- Automatic theme detection
- Similarity analysis
- Smart grouping suggestions
- Label generation

**Scoring Methods**
- **ICE**: Impact × Confidence × Ease
- **RICE**: Reach × Impact × Confidence ÷ Effort

#### How to Create a Brainstorm Session

1. Navigate to **Brainstorm Studio**
2. Click **+ New Session**
3. Configure session:
   - **Title**: Session name
   - **Goal**: What you're trying to achieve
   - **Template**: (Optional) Pre-defined structure
   - **Participants**: Add team members
   - **Roles**: Assign perspectives
   - **Time Limits**: Set duration for each phase
4. Click **Start Session**

#### Running a Session

**Phase 1 - Diverge**:
1. Timer starts automatically
2. Each participant contributes ideas
3. Encouragement to think freely
4. Quantity over quality
5. No criticism allowed
6. Timer alerts at milestones

**Phase 2 - Cluster**:
1. Review all submitted ideas
2. AI suggests initial groupings
3. Manually adjust clusters
4. Name each theme
5. Merge duplicates
6. Create hierarchy if needed

**Phase 3 - Score**:
1. Choose rubric (ICE or RICE)
2. Rate each idea or cluster:
   - **Impact**: How much value?
   - **Confidence**: How certain?
   - **Ease**: How simple? (ICE only)
   - **Reach**: How many affected? (RICE only)
   - **Effort**: How much work? (RICE only)
3. View calculated scores
4. Sort by priority
5. Select top ideas
6. Convert to work items

#### ICE vs RICE

**Use ICE when**:
- Quick prioritization needed
- Team is experienced with estimation
- Effort is relatively uniform
- Focus on quick wins

**Use RICE when**:
- Need more granular analysis
- Effort varies significantly
- Want to factor in reach/audience
- Strategic planning phase

#### Best Practices

**Before the session**:
- Set clear goal and scope
- Invite diverse perspectives
- Share background materials
- Allocate enough time (60-90 min typical)

**During diverge**:
- No criticism or debate
- Encourage wild ideas
- Build on others' thoughts
- Quantity over quality

**During cluster**:
- Start with AI suggestions
- Don't over-categorize (5-8 themes ideal)
- Use clear, descriptive labels
- Combine obvious duplicates

**During score**:
- Use consistent criteria
- Discuss outlier scores
- Consider both quick wins and long-term bets
- Document rationale for top picks

**After the session**:
- Export results
- Create work items for approved ideas
- Log strategic decisions
- Share summary with stakeholders

---

### Audit Engine

**Purpose**: Cross-pod compliance checks with evidence capture and audit pack generation.

#### Four Audit Types

Each type has specialized focus and color coding:

**1. Security/SOC2** (Gray-blue rail - Security pod)
- SOC2 and ISO control spot-checks
- SBOM/license scanning
- Incident readiness verification
- Access control audits

**2. IP Readiness** (Purple rail - IP pod)
- Claims ↔ feature mapping
- Figure legibility at 66% scale
- IDS/ADS stub verification
- Patent application support

**3. Brand-Lock** (Pink rail - Brand pod)
- Color palette compliance
- Typography consistency
- Logo lockup verification
- KDP/Shopify specification checks

**4. Finance Ops** (Green rail - Finance pod)
- CAC/COGS snapshots
- Budget variance analysis
- Approval chain verification
- Financial controls

#### Features

**Checklist Management**
- Pre-defined audit templates
- Custom checklist creation
- Item-by-item verification
- Pass/fail/NA marking

**Evidence Capture**
- Upload supporting documents
- Screenshot annotations
- Data snapshots
- Version tracking

**Finding Management**
- Record non-compliance issues
- Severity rating
- Remediation tracking
- Follow-up scheduling

**Audit Pack Export**
- Generate PDF reports
- Include all evidence
- Compliance summary
- Remediation roadmap

#### How to Conduct an Audit

1. Navigate to **Audit Engine**
2. Click **+ New Audit**
3. Select audit type:
   - Security/SOC2
   - IP Readiness
   - Brand-Lock
   - Finance Ops
4. Configure audit:
   - **Title**: Descriptive name
   - **Pods**: Which units to audit
   - **Due Date**: Completion deadline
   - **Template**: Standard or custom checklist
5. Click **Start Audit**

#### Working Through Checklists

1. **View Audit** to open checklist
2. For each item:
   - Read requirement
   - Verify compliance
   - Mark **Pass**, **Fail**, or **N/A**
   - Upload evidence if required
   - Add notes
3. If fails found:
   - Click **Record Finding**
   - Describe issue
   - Rate severity (Critical/High/Medium/Low)
   - Assign remediation owner
   - Set due date
4. Continue through all items
5. Review summary
6. Click **Export Pack** when complete

#### Evidence Best Practices

**What to capture**:
- Screenshots with annotations
- Configuration files
- Policy documents
- Test results
- Access logs
- Version numbers
- Timestamps

**How to document**:
- Clear file naming (YYYY-MM-DD_audit-type_item.ext)
- Include context in notes
- Link to source systems
- Version control evidence
- Redact sensitive information appropriately

#### Audit Scheduling

**Recommended frequencies**:
- **Security/SOC2**: Quarterly
- **IP Readiness**: Before major releases
- **Brand-Lock**: After rebrand or major UI updates
- **Finance Ops**: Monthly or quarterly

**Tips**:
- Schedule audits in advance
- Allocate adequate time (4-8 hours typical)
- Involve multiple stakeholders
- Review previous findings first
- Follow up on remediation items

---

## Foundation

### Pods & Persons

**Purpose**: Manage organizational units (pods) and team members (persons), establishing relationships.

#### Features

**Pod Management**
- Create organizational units
- Define charters and missions
- Set OpenAI thread IDs for integration
- View pod members
- Track pod statistics

**Person Management**
- Add team members
- Assign to pods
- Set roles and responsibilities
- Contact information
- Availability tracking

**Relationship Mapping**
- Link persons to pods
- Multiple pod membership
- Primary/secondary assignments
- Role definitions

#### Managing Pods

**To create a pod**:
1. Navigate to **Pods & Persons**
2. Click **+ New Pod**
3. Enter details:
   - **Name**: Pod identifier (e.g., "Product", "Marketing")
   - **Charter**: Mission and scope
   - **Thread ID**: (Optional) OpenAI thread for integration
4. Click **Create Pod**

**To edit a pod**:
1. Find pod in list
2. Click **Edit**
3. Update information
4. Click **Save**

**To archive a pod**:
1. Find pod in list
2. Click **Archive**
3. Confirm action
4. Pod moves to archived view

#### Managing Persons

**To add a person**:
1. Click **+ New Person** tab
2. Enter details:
   - **Name**: Full name
   - **Email**: Contact address
   - **Role**: Job title or function
   - **Primary Pod**: Main assignment
   - **Secondary Pods**: Additional assignments
3. Click **Add Person**

**To assign to pods**:
1. Edit person record
2. Select primary pod
3. Check secondary pod boxes
4. Define role in each pod
5. Save changes

#### Best Practices

**Pod structure**:
- Keep pods focused (5-15 people ideal)
- Clear, non-overlapping charters
- Defined ownership boundaries
- Regular charter reviews

**Person assignments**:
- Every person has one primary pod
- Limit secondary assignments (≤2)
- Clear role definitions
- Updated contact information

---

### Role Cards

**Purpose**: Manage Dream Team personas with rich metadata including RACI matrices.

#### Features

**Role Card System**
- 32 pre-defined personas
- Customizable attributes
- RACI matrix integration
- Bulk import/export

**Role Attributes**
- Handle (unique identifier)
- Title (display name)
- Pod assignment
- Expertise areas
- Tone/personality
- Responsibilities

**RACI Matrix**
- Responsible: Who does the work
- Accountable: Who has authority
- Consulted: Who provides input
- Informed: Who needs updates

#### Understanding Role Cards

Each role card contains:
- **Handle**: Short identifier (e.g., "prod-mgr")
- **Title**: Full name (e.g., "Product Manager")
- **Pod**: Organizational unit
- **Expertise**: Knowledge domains
- **Tone**: Communication style
- **Responsibilities**: What they do
- **RACI**: Cross-pod interaction matrix

#### Managing Role Cards

**To view role cards**:
1. Navigate to **Role Cards**
2. Browse list (shows handle, title, pod)
3. Use filters:
   - Filter by pod
   - Search by title/handle
4. Click card to view details

**To edit a role card**:
1. Click **Edit** on role card
2. Update fields:
   - Modify expertise
   - Adjust tone
   - Update responsibilities
   - Change RACI assignments
3. Click **Save Changes**

**To create a custom role**:
1. Click **+ New Role**
2. Fill in all required fields
3. Define RACI matrix
4. Assign to pod
5. Save role card

#### Bulk Import

**To import multiple roles**:
1. Click **Bulk Import**
2. Download CSV template
3. Fill in role data:
   - One role per row
   - All columns required
   - Follow format exactly
4. Upload completed CSV
5. Review preview
6. Confirm import

**CSV format**:
```
handle,title,pod,expertise,tone,responsibilities
prod-mgr,Product Manager,Product,UX Research|Data Analysis,Professional,Roadmap planning|Feature prioritization
```

#### RACI Best Practices

**Assigning RACI**:
- One Accountable per activity (max)
- Multiple Responsible okay
- Consult stakeholders early
- Inform broadly but selectively

**Common patterns**:
- Product Manager: Accountable for roadmap
- Engineering Lead: Responsible for implementation
- UX Designer: Consulted on features
- Marketing: Informed of releases

---

### Roster Admin

**Purpose**: Advanced team management with assignment rules and availability tracking. Also serves as the interface for creating and managing AI agents.

#### Features

**Team Roster**
- Complete team directory
- Role assignments
- Pod memberships
- Contact information

**Agent Creation & Management**
- Create new AI agents with validated forms
- Assign agents to pods
- Configure agent attributes and behaviors
- Set autonomy levels and expertise areas

**Assignment Rules**
- Auto-assignment based on criteria
- Load balancing
- Skill matching
- Availability checking

**Availability Tracking**
- PTO/vacation scheduling
- Capacity planning
- Workload distribution
- Coverage management

#### Creating New Agents

**To create a new agent**:
1. Navigate to **Roster Admin** or **Roles** page
2. Click **+ Create Agent** button
3. Fill in the required fields (marked with *):
   - **Agent ID**: Unique identifier (e.g., `agent_example`)
   - **Title**: Display name for the agent
   - **Pod Name**: Select from available pods
   - **Expertise Areas**: Key skills (comma-separated or multiple entries)
   - **Tone**: Communication style (Professional, Friendly, etc.)
   - **Autonomy Level**: L0 (Full) to L3 (Human-in-Loop)
4. Optionally configure:
   - **Skill Pack Path**: Directory path for agent's skill pack
   - **System Prompt**: Core instructions and behavior
5. Click **Create Agent** to save

**Form Validation**: The agent creation form uses real-time validation to ensure:
- All required fields are completed
- Agent ID follows proper naming conventions
- Pod name is selected from available options
- All data meets system requirements

**Tips for Agent Creation**:
- Use descriptive, unique agent IDs
- Assign agents to the most relevant pod
- L0 autonomy = Full autonomy; L3 = Requires human approval
- System prompts help define agent personality and behavior

#### Managing the Roster

**To view the roster**:
1. Navigate to **Roster Admin** or **Roles** page
2. See complete team list (agents + persons)
3. Filter by pod, role, agent type
4. Sort by name, pod, availability
5. Use pod-colored filter buttons for quick pod selection

**To update availability**:
1. Find person in roster
2. Click **Set Availability**
3. Mark dates:
   - Available
   - Limited availability
   - Out of office
4. Add notes (reason, coverage)
5. Save changes

**To configure auto-assignment**:
1. Go to **Assignment Rules**
2. Define criteria:
   - Pod match
   - Skill requirements
   - Current workload
   - Availability
3. Set priority order
4. Enable rule
5. Test with sample items

#### Capacity Planning

**View team capacity**:
1. Select time period (week/month)
2. View aggregate availability
3. Identify gaps
4. Plan coverage

**Workload distribution**:
1. See current assignments per person
2. Identify overloaded individuals
3. Redistribute work
4. Balance across team

---

### Roles ⇄ Specs Sync

**Purpose**: Generate and synchronize Agent Specifications from Role Cards with two-way diff views.

#### Features

**Two-Way Sync**
- Role Cards → Agent Specs
- Agent Specs → Role Cards
- Diff view shows changes
- Selective sync options

**Smart Suggestions**
- Instruction blocks
- Tool recommendations
- System prompts
- Policy templates

**Pod-Specific Baselines**
- Marketing baseline
- IP baseline
- Security baseline
- Brand baseline
- Product baseline
- Finance baseline
- Control Tower baseline

**Batch Actions**
- Apply changes to multiple agents
- Bulk policy updates
- Mass re-generation
- Rollback capabilities

#### How Sync Works

**Role Card to Agent Spec**:
1. Reads role attributes (expertise, tone, responsibilities)
2. Applies pod-specific baseline prompts
3. Generates instruction blocks
4. Suggests appropriate tools
5. Creates system prompts
6. Defines policies
7. Outputs complete Agent Spec

**Agent Spec to Role Card**:
1. Analyzes Agent Spec content
2. Extracts core attributes
3. Updates Role Card fields
4. Preserves RACI matrix
5. Maintains consistency

#### Using the Sync Interface

**To generate Agent Specs**:
1. Navigate to **Roles ⇄ Specs Sync**
2. Select role cards to sync
3. Choose baseline prompt (or auto-detect by pod)
4. Click **Generate Specs**
5. Review diff view:
   - Green: Additions
   - Red: Deletions
   - Yellow: Modifications
6. Accept or reject changes
7. Click **Apply Selected**

**To review suggestions**:
1. After generation, view **Smart Suggestions**
2. Categories:
   - Instruction blocks (how agent should behave)
   - Tools (what agent can use)
   - System prompts (core directives)
   - Policies (rules and constraints)
3. Select which to include
4. Customize if needed
5. Apply to agent spec

**Batch operations**:
1. Select multiple roles (checkbox)
2. Choose action:
   - **Regenerate All**: Fresh sync
   - **Update Policies**: Apply new policy
   - **Change Baseline**: Switch pod template
3. Preview changes
4. Confirm batch action

#### Pod Baseline Prompts

Each pod has specialized instructions:

**Marketing**:
- Focus on audience, messaging, campaigns
- Data-driven decision making
- Brand consistency
- Growth metrics

**IP (Intellectual Property)**:
- Patent strategy and filing
- Prior art searches
- Claims mapping
- Invention disclosure

**Security**:
- Threat modeling
- Compliance frameworks (SOC2, ISO)
- Access control
- Incident response

**Brand**:
- Visual identity consistency
- Brand voice and tone
- Asset management
- Style guide enforcement

**Product**:
- User-centric thinking
- Data analysis
- Roadmap planning
- Prioritization frameworks

**Finance**:
- Budget management
- Financial modeling
- Approval workflows
- Reporting standards

**Control Tower**:
- Cross-pod coordination
- High-level oversight
- Escalation handling
- Strategic alignment

#### Best Practices

**When to sync**:
- After role card updates
- When onboarding new AI capabilities
- Quarterly review and refresh
- After major pod restructuring

**Review changes carefully**:
- Don't auto-apply without review
- Understand what changed and why
- Test agents after sync
- Keep backup of working specs

**Maintain consistency**:
- Use baselines for pod alignment
- Apply policies uniformly
- Document custom modifications
- Version control agent specs

---

## User Settings

### Accessing Settings

Currently, user settings are managed at the organizational level. Individual user preferences will be added in future releases.

### Available Settings

**Display Preferences**
- The platform uses a dark theme by default
- Glass-morphism aesthetic is standard
- Pod colors are fixed per organizational unit

**Notification Settings**
- Browser notifications (if permissions granted)
- Toast messages for actions
- Success/error feedback

### Future Settings

Planned user settings include:
- Personal theme preferences
- Notification frequency
- Default filters and views
- Keyboard shortcuts
- Language selection

---

## Tips & Best Practices

### General Tips

**Navigation**
- Use keyboard shortcuts: `Ctrl/Cmd + K` to search (coming soon)
- Sidebar can be collapsed to save screen space
- Breadcrumbs show your current location
- Browser back button works throughout the app

**Data Entry**
- Required fields marked with asterisk (*)
- Form validation provides real-time feedback
- Save drafts frequently (auto-save coming soon)
- Use consistent naming conventions

**Search & Filter**
- Combine multiple filters for precision
- Save commonly-used filter sets
- Full-text search works across all fields
- Use quotes for exact phrase matching

**Performance**
- Keep browser updated for best performance
- Clear cache if experiencing issues
- Large lists auto-paginate
- Export data for offline analysis

### Workflow Optimization

**Orchestration Workflows**
1. Start week by reviewing Dashboard
2. Process Intake items daily
3. Log decisions immediately when made
4. Update work item statuses in real-time
5. Review priorities weekly

**Collaboration Workflows**
1. Use Chat for quick questions
2. Document important conversations
3. Provide regular feedback to agents
4. Run audits on schedule
5. Export and share results

**Cross-Pod Coordination**
1. Use Summon for clear requests
2. Mirror-Back to report completion
3. Tag all relevant pods
4. Link related items
5. Maintain canonical threads

### Data Quality

**Maintaining clean data**:
- Use consistent terminology
- Fill in all required fields
- Link related items
- Update statuses promptly
- Archive completed items

**Audit trail**:
- Everything is timestamped
- Changes are logged
- History is preserved
- Evidence is versioned

### Security Best Practices

**Access control**:
- Use appropriate permissions
- Review access regularly
- Remove inactive users
- Audit security logs

**Data handling**:
- Don't share credentials
- Use secure connections (HTTPS)
- Redact sensitive information before screenshots
- Follow data retention policies

### AI Interaction

**Getting best results**:
- Be specific in requests
- Provide context
- Use appropriate persona
- Give feedback on responses
- Iterate on complex tasks

**Training agents**:
- Consistent feedback improves performance
- Correct errors immediately
- Reinforce good behaviors
- Document edge cases

---

## Troubleshooting

### Common Issues

#### "Page not loading"
**Symptoms**: Blank page, spinner doesn't stop, error message

**Solutions**:
1. Refresh the page (F5 or Ctrl/Cmd + R)
2. Clear browser cache and cookies
3. Try different browser
4. Check internet connection
5. Contact administrator if issue persists

#### "Can't create work item"
**Symptoms**: Form won't submit, validation errors

**Solutions**:
1. Check all required fields are filled
2. Verify date formats (use date picker)
3. Ensure no special characters in forbidden fields
4. Try selecting different pod
5. Check browser console for errors

#### "AI persona not responding"
**Symptoms**: Message sent but no response, error toast

**Solutions**:
1. Verify OpenAI integration is configured
2. Check if you've reached API limits
3. Try different persona
4. Reduce message length
5. Wait a moment and retry

#### "Can't upload file"
**Symptoms**: Upload fails, file rejected

**Solutions**:
1. Check file size (< 10MB typical limit)
2. Verify file type is allowed
3. Ensure file name has no special characters
4. Try different file format
5. Compress large files

#### "Changes not saving"
**Symptoms**: Edit made but reverts, no confirmation

**Solutions**:
1. Check for validation errors
2. Ensure you clicked Save button
3. Verify you have edit permissions
4. Check network connection
5. Try refreshing and re-editing

### Error Messages

**"No thread configured"** (⚠️ in pod dropdown)
- Pod doesn't have OpenAI thread ID set
- Messages will log to console instead
- Contact admin to configure thread integration

**"Missing required fields"**
- Form incomplete
- Fill in all fields marked with *
- Check for hidden validation errors

**"Failed to load data"**
- Network issue or server error
- Refresh the page
- Check if service is running
- Contact support if persistent

### Getting Help

**Self-Service**:
1. Check this user manual
2. Review tooltips (hover over ? icons)
3. Search FAQ (coming soon)
4. Read release notes

**Support Channels**:
1. In-app help button (if available)
2. Email: support@dreamteamhub.com
3. Slack channel: #dreamteam-support
4. Submit bug report: [URL]

**What to include in bug reports**:
- What you were trying to do
- What you expected to happen
- What actually happened
- Steps to reproduce
- Screenshots if applicable
- Browser and OS version

---

## Glossary

**Agent**: AI persona with specific role, expertise, and behavior

**Artifact**: Supporting document or file linked to decisions/audits

**Audit Pack**: Exported report containing audit results and evidence

**Baseline Prompt**: Pod-specific template for agent behavior

**Brainstorm Session**: Structured ideation process with diverge/cluster/score phases

**Charter**: Mission and scope definition for a pod

**Cluster**: Grouped set of similar ideas in brainstorming

**Decision Log**: Immutable record of organizational decisions

**Diverge**: First phase of brainstorming (idea generation)

**Evidence**: Documentation supporting audit findings or decisions

**Finding**: Non-compliance issue discovered during audit

**Glass-morphism**: UI design style with semi-transparent, blurred surfaces

**Handle**: Short identifier for a role (e.g., "prod-mgr")

**ICE**: Scoring method (Impact × Confidence × Ease)

**Intake**: Process of receiving and routing work items

**Mirror-Back**: Report of completed work to requesting pod

**Persona**: AI agent with defined role and personality

**Pod**: Organizational unit or team

**Pod Rail**: Colored gradient bar indicating pod association

**Priority**: Urgency level (P0=Critical, P1=High, P2=Medium, P3=Low)

**RACI**: Responsibility matrix (Responsible, Accountable, Consulted, Informed)

**Rationale**: Explanation of why a decision was made

**RICE**: Scoring method (Reach × Impact × Confidence ÷ Effort)

**Role Card**: Definition of AI persona attributes and responsibilities

**Roster**: Complete team directory with assignments

**Score**: Third phase of brainstorming (prioritization)

**Spec**: Agent specification (detailed configuration)

**Status Pill**: Visual indicator of item state (Active/Pending/Archived)

**Summon**: Request for action sent to a pod

**Sync**: Bidirectional update between Role Cards and Agent Specs

**Thread**: OpenAI conversation context for pod integration

**Work Item**: Task, feature, bug, or initiative in Intake system

---

## Appendix

### Keyboard Shortcuts

*Coming in future release*

### API Documentation

For developers integrating with Dream Team Hub:
- REST API documentation: [URL]
- Webhook configuration: [URL]
- OAuth setup: [URL]

### Release Notes

**Version 1.0** (November 2025)
- Initial release
- All core modules operational
- 32 AI personas active
- Pod-specific color system implemented
- Glass-morphism UI complete
- WCAG AAA accessibility compliance

### Acknowledgments

Dream Team Hub is developed by **i³ collective** with contributions from Product, Engineering, Design, and Security pods.

---

**End of User Manual**

*For updates to this manual, check the version number and last updated date at the top of this document. Submit documentation feedback to docs@dreamteamhub.com*
