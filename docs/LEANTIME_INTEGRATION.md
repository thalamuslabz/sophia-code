# Leantime Integration

**Project management for AI-assisted development.**

---

## Overview

Leantime integration automatically:

- **Creates tickets** from development intents
- **Updates status** as builds progress
- **Adds evidence** as comments
- **Links to Obsidian** documentation

```
Intent Created → Leantime Ticket → Build Progress → Ticket Updated
                     ↓
              Project Dashboard
```

---

## Setup

### 1. Configure Leantime

```bash
# Access Leantime at http://localhost:8081
# Create an API key in Settings → API
```

### 2. Configure n8n

```bash
# In n8n (http://localhost:3118)
# Go to Settings → Credentials
# Add "HTTP Header Auth" credential:
#   - Name: Leantime API Key
#   - Value: your-api-key-here
```

### 3. Set Environment Variables

```bash
# Add to .env or export
export LEANTIME_URL=http://localhost:8081
export LEANTIME_API_KEY=your-api-key
```

---

## How It Works

### Intent → Ticket Flow

```
User: /build Create authentication system
         ↓
Webhook triggered
         ↓
Ticket created:
  Title: sophia/Create authentication system
  Tags: ai-generated, thalamus
         ↓
Status: "New"
```

### Build Progress Updates

```
Build starts
    ↓
Ticket updated: "In Progress"
    ↓
Build completes
    ↓
Comment added with:
  - Status (✅/❌)
  - Test results
  - Artifact count
  - Obsidian link
    ↓
Ticket status: "Done" or "In Progress"
```

---

## Ticket Structure

```markdown
## Intent ID
intent-2024-02-17-001

## Description
Create authentication system with JWT tokens...

## Acceptance Criteria
- [ ] User can login with email/password
- [ ] JWT tokens are generated
- [ ] Protected routes work

## Tech Stack
- React
- Node.js
- JWT
```

---

## Project Mapping

Map projects to Leantime project IDs:

```typescript
const projectMapping = {
  'sophia': 1,
  'synaptica': 2,
  'executioniq': 3,
  'aso': 4
};
```

Configure in n8n workflow or environment.

---

## CLI Usage

```bash
# Create ticket from intent
leantime-sync create \
  --intent intent-001.json \
  --project sophia

# Update with evidence
leantime-sync update \
  --ticket 123 \
  --evidence evidence-001.json

# List projects
leantime-sync projects
```

---

## API Usage

```typescript
import { LeantimeClient } from '@thalamus/leantime-integration';

const client = new LeantimeClient({
  baseUrl: 'http://localhost:8081',
  apiKey: 'your-api-key'
});

// Create ticket from intent
const ticket = await client.createTicketFromIntent({
  intent_id: 'intent-001',
  project: 'sophia',
  name: 'Add auth',
  description: '...',
  acceptance_criteria: ['...']
});

// Add build evidence
await client.addBuildEvidence(ticket.id, {
  intent_id: 'intent-001',
  status: 'success',
  artifacts: 12,
  test_results: { passed: 15, failed: 0 }
});
```

---

## Best Practices

1. **Use consistent project names** across systems
2. **Tag all AI tickets** for filtering
3. **Review evidence comments** before closing
4. **Link to Obsidian** for full context

---

## Troubleshooting

### "Project not found"

Check project mapping configuration:
```bash
# List available projects
curl -H "x-api-key: YOUR_KEY" \
  http://localhost:8081/api/jsonrpc \
  -d '{"jsonrpc":"2.0","method":"leantime.rpc.Projects.getAll","params":{},"id":1}'
```

### "Authentication failed"

Verify API key in n8n credentials.

---

**Track your AI development work in Leantime! 📊**
