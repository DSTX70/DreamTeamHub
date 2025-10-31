# Dream Team Hub - Design Guidelines

## Design Approach

**Selected Approach**: Design System with Linear + Notion inspiration

**Rationale**: Dream Team Hub is an information-dense, utility-focused orchestration platform requiring efficient workflows, clear data hierarchy, and professional consistency. Drawing from Linear's clean project management aesthetic and Notion's flexible data organization, with Material Design principles for component reliability.

**Core Principles**:
- Clarity over decoration - every element serves a purpose
- Information density with breathing room
- Scannable hierarchies for quick decision-making
- Consistent patterns across all modules

---

## Typography

**Font Stack**: 
- Primary: Inter (Google Fonts) for UI and data
- Monospace: JetBrains Mono for IDs, timestamps, SHA256 hashes

**Hierarchy**:
- Page Titles: text-2xl font-semibold (32px)
- Section Headers: text-xl font-semibold (24px)
- Card/Module Titles: text-lg font-medium (20px)
- Body/Data: text-base font-normal (16px)
- Labels/Meta: text-sm font-medium (14px)
- Captions/Timestamps: text-xs font-normal (12px)
- Code/Hashes: text-sm font-mono

**Application**:
- Dashboard widgets use text-lg for counts, text-sm for labels
- Tables use text-sm for cells, text-xs for column headers
- Forms use text-sm labels, text-base inputs
- Buttons use text-sm font-medium

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8 for consistency
- Micro spacing (between related items): p-2, gap-2
- Standard spacing (cards, sections): p-4, gap-4, mb-6
- Major spacing (module separation): p-8, gap-8, mb-8

**Grid Structure**:
- Main container: max-w-screen-2xl mx-auto px-6
- Sidebar: fixed w-64 (256px) on desktop, collapsible on mobile
- Content area: flex-1 with max-w-7xl constraint for readability
- Dashboard widgets: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Data tables: Full width within content constraints

**Responsive Breakpoints**:
- Mobile: base (< 768px) - single column, collapsed nav
- Tablet: md (768px+) - 2-column grids, visible sidebar
- Desktop: lg (1024px+) - full dashboard, expanded tables
- Wide: xl (1280px+) - 4-column widgets, side-by-side panels

---

## Navigation Architecture

**Primary Navigation** (Left Sidebar):
- Fixed position, full height
- Logo/app name at top (h-16)
- Module groups with icon + label (h-10 each)
- Groups: Control Tower, Orchestration (Intake, Decisions), Collaboration (Brainstorm, Audit), Foundation (Pods, Roles)
- Active state: subtle left border (border-l-2)
- Expand/collapse button at bottom

**Secondary Navigation** (Top Bar):
- Fixed top, h-16, spans content area
- Breadcrumbs on left (text-sm)
- Global actions center (search, create new)
- User profile + notifications right (h-8 w-8 avatar)

**Module Tabs** (Contextual):
- Horizontal tabs below top bar when needed
- Tab height: h-12
- Examples: Brainstorm (Ideas/Clusters/Scoring), Audit (Checks/Findings/Pack)

---

## Component Library

### Cards & Containers

**Dashboard Widget Card**:
- Structure: p-6, rounded-lg border
- Header: flex justify-between items-start mb-4
- Title: text-lg font-medium
- Action icon: h-5 w-5
- Value display: text-3xl font-semibold mb-2
- Sublabel: text-sm

**Data Card** (Role Cards, Decisions):
- Structure: p-4, rounded-lg border
- Header with title + badge: flex items-center gap-2 mb-3
- Content sections: space-y-3
- Footer with metadata: flex items-center justify-between text-xs mt-4

**Module Container**:
- Background container: p-8
- Inner card: max-w-5xl mx-auto rounded-xl border p-6

### Data Display

**Tables**:
- Container: rounded-lg border overflow-hidden
- Header row: p-4, border-b, text-xs font-medium uppercase tracking-wide
- Data rows: p-4, border-b last:border-b-0, hover state
- Sticky header on scroll: sticky top-0
- Column actions: text-right for numbers, text-left for text
- Sortable columns: cursor-pointer with sort icon (h-4 w-4)
- Status badges in dedicated column: inline-flex px-2 py-1 rounded-full text-xs

**Lists** (Assignments, Top-5):
- Item height: min-h-16, p-4
- Flex layout: flex items-center justify-between gap-4
- Priority indicator: w-1 h-full rounded-full (left accent)
- Content: flex-1, structured vertically
- Actions: flex items-center gap-2

**Tag Collections** (Tags, Responsibilities):
- Container: flex flex-wrap gap-2
- Tag: inline-flex items-center px-2.5 py-0.5 rounded-full text-xs

### Forms & Input

**Form Layout**:
- Container: space-y-6
- Field group: space-y-2
- Label: text-sm font-medium block mb-2
- Input: w-full p-2.5 rounded-md border text-base
- Helper text: text-xs mt-1
- Multi-column forms: grid grid-cols-1 md:grid-cols-2 gap-6

**Specialized Inputs**:
- Select dropdowns: p-2.5 rounded-md border with chevron icon
- Multi-select: tag input with removable chips
- Date picker: calendar icon right, p-2.5
- Rich text editor: min-h-32, toolbar at top
- File upload: dashed border, p-8, drag-drop zone

**Action Buttons**:
- Primary: px-4 py-2 rounded-md font-medium text-sm
- Secondary: px-4 py-2 rounded-md border font-medium text-sm
- Icon button: h-8 w-8 rounded-md
- Button groups: inline-flex rounded-md (first:rounded-l-md last:rounded-r-md)

### Dialogs & Overlays

**Modal Structure**:
- Backdrop: fixed inset-0
- Container: max-w-2xl mx-auto mt-24 rounded-xl
- Header: p-6 border-b, flex justify-between items-center
- Body: p-6, max-h-[60vh] overflow-y-auto
- Footer: p-6 border-t, flex justify-end gap-3

**Side Panel** (Details, Properties):
- Fixed right, w-96, h-full, border-l
- Slide-in animation
- Close button top-right: h-8 w-8
- Content: p-6, space-y-6

**Dropdown Menu**:
- Container: rounded-lg border shadow-lg min-w-48
- Item: p-2 hover state, flex items-center gap-2
- Divider: border-t my-1
- Icon left: h-4 w-4

### Status & Feedback

**Badges**:
- Size: px-2.5 py-0.5 rounded-full text-xs font-medium
- Status types: todo, in_progress, blocked, done
- Severity types: low, medium, high, critical
- Context-aware styling (defined by state, not color)

**Progress Indicators**:
- Linear progress: h-2 rounded-full overflow-hidden w-full
- Fill: h-full rounded-full transition-all
- Brainstorm timer: h-3 with percentage text above

**Empty States**:
- Container: text-center py-16
- Icon: h-12 w-12 mx-auto mb-4
- Title: text-lg font-medium mb-2
- Description: text-sm max-w-sm mx-auto mb-6
- CTA button: centered

### Module-Specific Components

**Control Tower Dashboard**:
- Grid: 4 widgets top (Top-5, Assignments, Escalations, Activity)
- Widget content: scrollable max-h-80
- Quick action bar: sticky bottom of each widget

**Brainstorm Studio**:
- Session header: title, goal, participants (avatars), timer bar
- Ideas grid: masonry layout, cards with voting UI
- Cluster view: drag-drop zones with grouped cards
- Scoring panel: sliders for Impact/Effort/Confidence, live calculation

**Audit Engine**:
- Checklist: items with checkbox, title, severity badge, evidence button
- Evidence modal: file upload, link input, preview
- Pack export: summary card with download button, file list, SHA256 display

**Role Cards**:
- Card layout: avatar/icon top, handle + title, pod badge
- Expandable sections: Core Functions, Responsibilities, DoD (each with icons)
- RACI matrix: table with colored cells for R/A/C/I roles

**Decision Log**:
- Timeline layout: vertical line with decision cards
- Card structure: summary, rationale block, approver + date, artifacts list
- Effective date badge: prominent top-right

---

## Interaction Patterns

**Hover States**:
- Cards: subtle shadow increase
- Table rows: background shift
- Buttons: opacity shift to 90%
- Links: underline appears

**Loading States**:
- Skeleton screens for data tables (5 rows)
- Spinner for actions: inline h-4 w-4 for buttons
- Progress bar for bulk operations

**Transitions**:
- Default: transition-all duration-200
- Slide panels: transition-transform duration-300
- Expand/collapse: transition-height duration-200

**Drag & Drop** (Brainstorm clusters):
- Draggable: cursor-move, subtle scale on grab
- Drop zone: dashed border when active
- Drop preview: ghost card

---

## Data Visualization

**Dashboard Metrics**:
- Large number: text-3xl font-semibold
- Trend indicator: inline-flex with arrow icon, percentage change
- Sparklines: h-8 w-24 for compact trend

**Charts** (Performance, Audit scores):
- Simple bar/line charts using minimal styling
- Axis labels: text-xs
- Legend: horizontal, text-sm, gap-4
- Tooltip on hover: rounded-lg p-2 shadow-lg

**RACI Matrix**:
- Table with cell background intensity by role type
- Legend below: horizontal pills explaining R/A/C/I

---

## Accessibility & Usability

**Keyboard Navigation**:
- Focus rings: ring-2 ring-offset-2 rounded (visible focus states)
- Tab order: logical flow through forms and actions
- Escape to close: modals and panels

**Screen Reader Support**:
- ARIA labels on icon-only buttons
- Status announcements on success/error
- Table headers properly scoped

**Data Density**:
- Comfortable row heights: min-h-12 for lists, min-h-16 for complex items
- Adequate touch targets: min 44px (h-11) on mobile
- Readable line length: max-w-prose for long text

---

## Animation Budget

**Essential Only**:
- Modal enter/exit: fade + scale
- Panel slide-in: translate
- Progress updates: smooth width transitions
- Status changes: subtle pulse once

**No Gratuitous Animations**:
- No scroll-triggered effects
- No complex page transitions
- No auto-playing carousels
- Focus on instant, purposeful interactions

---

This design system creates a professional, efficient platform optimized for complex workflows and information management while maintaining visual clarity and consistency across all modules.