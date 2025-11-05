# DTH Copilot - User Guide

## Overview

DTH Copilot is an AI-powered assistant that helps you query roles and agents using natural language. It leverages OpenAI's GPT-4 with function calling to intelligently route your questions to the appropriate API endpoints.

## Features

### 🚀 Quick Actions

Pre-built prompts for common queries:

1. **Smoke Test** - Verify API health by testing roles and agents endpoints
2. **List L1 Support (5)** - Show first 5 L1 Support agents with KPIs
3. **Search 'router'** - Find agents with 'router' in their name
4. **Role: product_owner** - Display Product Owner role card details

### 💬 Natural Language Queries

Ask questions in plain English:
- "List all L1 agents in the Support pod"
- "Show me agents with pilot status"
- "What roles are in the Engineering pod?"
- "Search for agents working on authentication"

### 📊 Response Formats

- **Agent Summaries**: Markdown tables with KPIs (success rate, latency, cost)
- **Role Details**: Structured key-value pairs
- **Smoke Test**: Traffic light status (Green/Amber/Red) with diagnostics

## Accessing the Copilot

### In-App Interface

1. Navigate to **Integrations** from the sidebar
2. Use quick action buttons or type your question
3. View formatted responses with markdown tables

### Custom GPT (Optional)

If your admin has configured a Custom GPT link:
- Click the "Open in ChatGPT" button
- Use the same natural language queries
- Access DTH data from ChatGPT interface

## Quick Action Reference

| Button | Query | Returns |
|--------|-------|---------|
| Smoke Test | API health check | Green/Amber/Red status with diagnostics |
| List L1 Support (5) | First 5 L1 Support agents | Table with KPIs and status |
| Search 'router' | Agents matching 'router' | Filtered agent list |
| Role: product_owner | Product Owner role card | Role details and responsibilities |

## Example Queries

### Agent Queries
```
"List L1 Support agents (limit 5)"
"Show pilot agents in Support pod"
"Search for agents with 'router' in their name"
"List all L2 agents with live status"
```

### Role Queries
```
"Show role by handle product_owner"
"Get details for engineering_lead role"
```

### Smoke Tests
```
"Smoke Test"
"Run API health check"
```

## Response Format Examples

### Agent Summary Table
```markdown
| display_name | level | status | next_gate | success% | p95(s) | cost($) |
|---|---|---|---:|---:|---:|---:|
| Router | L1 | pilot | 2 | 84% | 4.2 | 0.035 |

_count:_ **45**, _limit:_ **5**, _offset:_ **0**
```

### Role Details
```markdown
**name:** Product Owner
**handle:** product_owner
**pod:** Product Management Pod
**category:** Leadership
**display_name:** Product Owner
**autonomy_level:** L2
```

### Smoke Test Result
```markdown
**DTH API Smoke Test: 🟢 Green**

✅ Roles API: OK (57 total)
✅ Agents API: OK (45 total)

_Test completed at 2025-11-05T02:20:45.123Z_
```

## Features for Admins

### Custom GPT Link

Admins can configure a Custom GPT link to:
- Share ChatGPT-based DTH Copilot with stakeholders
- Copy and distribute the GPT URL
- Open the Custom GPT in a new tab

**Environment Variable**: Set `VITE_CUSTOM_GPT_URL` in your environment

## Rate Limiting

- **Limit**: 30 requests per minute per user (configurable)
- **On Exceeded**: 429 status with retry information
- **Reset**: Automatic after 60 seconds

## Technical Details

### API Endpoint
- **Path**: POST /copilot/ask
- **Authentication**: Session-based (Replit Auth)
- **Request**: `{ "message": "your question here" }`
- **Response**: `{ "reply": "formatted markdown response" }`

### Supported Tools
1. **listRoles** - Paginated role listing
2. **getRoleByHandle** - Single role lookup by handle
3. **getAgentSummaries** - Filtered agent summaries with KPIs

### Data Sources
- **Roles API**: `/api/roles` (dual auth)
- **Agents API**: `/api/agents/summary` (dual auth)

## Validation Rules

Copilot enforces strict validation:
- **HTTP ≠ 200**: Stops with error message
- **Non-JSON**: Reports upstream error
- **Missing Fields**: Shows "—" for optional fields
- **Auth Failures**: Clear 401/403 messages

## Tips for Best Results

1. **Be specific**: "List L1 Support agents" works better than "show me agents"
2. **Use filters**: "pilot agents in Support pod" narrows results
3. **Check quick actions**: Often faster than typing
4. **Review tables**: KPIs show task success, latency, and cost
5. **Use smoke test**: Quick way to verify API health

## Troubleshooting

### No Response
- Check your internet connection
- Verify you're logged in
- Try a quick action button

### Error Messages
- **429 Too Many Requests**: Wait 60 seconds
- **401 Unauthorized**: Log in again
- **500 Internal Error**: Contact support

### Unexpected Results
- Try rephrasing your question
- Use a quick action as reference
- Check if data exists in the system

## Future Enhancements

Planned features:
- Keyboard shortcuts (1-4 for quick actions)
- Role-based access control for sensitive queries
- Analytics dashboard for usage patterns
- Additional quick actions for common workflows

## Support

For issues or questions:
1. Check the **Platform Guide** in the sidebar
2. Try the **Interactive Demo** for tutorials
3. Contact your system administrator

---

**Powered by OpenAI GPT-4** | **Read-Only Access** | **Secure & Private**
