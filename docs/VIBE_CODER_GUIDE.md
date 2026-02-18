# 🎵 Vibe Coder's Guide to Thalamus AI

> **Zero-config, AI-powered development that just works.**

---

## What is This?

**Thalamus AI** is a complete development environment for vibe coders — developers who want to describe what they want and let AI handle the implementation, while staying in control.

### The Vibe

```
You: "Build me a React todo app with auth"

Thalamus:
  ✓ Creates structured spec
  ✓ Routes to AI agents
  ✓ Enforces security policies
  ✓ Records everything
  ✓ Syncs to your notes
  
You: Review, approve, done. ☕
```

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- macOS, Linux, or WSL2
- Node.js 18+ (check with `node --version`)
- Docker Desktop (optional, for full stack)

### Install

```bash
# Clone the repo
git clone https://github.com/your-org/thalamus-ai.git
cd thalamus-ai

# One-command setup
./install.sh
```

That's it. Really.

---

## 🎯 Your First Vibe Session

### 1. Open the Chat

Go to **http://localhost:3115** — this is Open WebUI, your AI chat interface.

### 2. Describe Your Project

```
You: Build me a Next.js blog with:
      - Markdown posts
      - Tag filtering
      - Dark mode
      - Vercel deploy ready

You: /build
```

### 3. Watch the Magic

| Step | What Happens | Where to See |
|------|--------------|--------------|
| 1 | Intent captured | Open WebUI |
| 2 | Spec generated | `~/.auto-claude/specs/` |
| 3 | Routed to agents | Dashboard: http://localhost:9473 |
| 4 | Code written | `~/code/ac-projects/` |
| 5 | Evidence recorded | 📚 Obsidian (auto-synced) |
| 6 | Ticket created | 📊 Leantime (auto) |
| 7 | Search indexed | 🔍 Qdrant (semantic) |

### 4. Review & Iterate

The AI agents will:
- ✅ Follow security policies (no secrets in code)
- ✅ Write tests
- ✅ Document decisions
- ✅ Record screen captures

You review, approve, or request changes.

---

## 📁 Project Structure

```
my-project/
├── src/                    # Your code
├── .sophia/
│   ├── config.yaml         # Project settings
│   ├── sophia.db           # Memory & sessions
│   ├── policies/           # Governance rules
│   └── generated/          # Agent configs
├── CLAUDE.md               # Auto-injected rules
└── package.json
```

---

## 🎮 Daily Workflow

### Starting Work

```bash
cd my-project

# Check project health
sophia status

# Start a session (tracks your work)
sophia session start --intent "Add user profiles"

# Claim files you'll work on
sophia session claim "src/features/profile/**"
```

### While Coding

```bash
# Check if file is claimed
sophia session check src/features/profile/Avatar.tsx

# View recent activity
sophia bulletin

# Get policy explanation
sophia explain SEC-001
```

### Before Commit

```bash
# Run governance checks
sophia verify

# Auto-fix issues (where possible)
sophia policy fix
```

### After Work

```bash
# Record what worked
sophia memory pattern \
  --desc "React Query cache invalidation" \
  --impl "Use queryClient.invalidateQueries(['users'])" \
  --keywords "react-query,cache,invalidation"

# Record what didn't (so AI remembers)
sophia memory correct \
  --pattern "Used useEffect for data fetching" \
  --reason "Causes race conditions" \
  --fix "Use React Query instead" \
  --keywords "react,data-fetching"

# End session
sophia session end
```

---

## 🛡️ Built-in Protection

Thalamus automatically prevents:

| Issue | Detection | Action |
|-------|-----------|--------|
| Hardcoded secrets | Pattern scan | ❌ Blocks commit |
| Missing tests | Heuristic check | ⚠️ Warns |
| Large binaries | File size check | ❌ Blocks commit |
| UI library mixing | Import analysis | ⚠️ Warns |
| Skipped tests | Pattern scan | ⚠️ Warns |

---

## 🌐 The Full Stack

| Service | URL | Purpose |
|---------|-----|---------|
| **Open WebUI** | http://localhost:3115 | Chat with AI |
| **n8n** | http://localhost:3118 | Workflow automation |
| **Sophia Dashboard** | http://localhost:9473 | Project governance |
| **Orchestrator** | http://localhost:7654 | Build management |
| **Leantime** | http://localhost:8081 | Project management |
| **Qdrant** | http://localhost:6333 | Vector search |

---

## 🎨 Customization

### Change Governance Level

Edit `.sophia/config.yaml`:

```yaml
user:
  experience_level: beginner  # beginner | intermediate | advanced
governance_level: startup     # community | startup | enterprise
```

### Add Custom Policies

Create `.sophia/policies/my-rules.yaml`:

```yaml
policy:
  id: "my-rules"
  name: "My Project Rules"
  
rules:
  - id: "NO-CONSOLE"
    name: "No console.log in production"
    severity: yellow
    description: "Remove console.log before committing"
    detection:
      patterns:
        - "console\\.log\\("
      file_types: ["*.ts", "*.tsx"]
```

### Connect Your Notes

Set up Obsidian sync in `n8n`:

1. Go to http://localhost:3118
2. Import workflow from `apps/n8n-workflows/obsidian-sync.json`
3. Configure your vault path
4. Done — builds auto-sync to notes

---

## 🐛 Troubleshooting

### "sophia command not found"

```bash
# Add to your shell
export PATH="$HOME/.local/bin:$PATH"

# Or use npx
npx sophia status
```

### "Docker containers won't start"

```bash
# Check Docker is running
docker ps

# View logs
docker compose logs -f openwebui

# Reset everything
docker compose down -v
docker compose up -d
```

### "Agents not respecting rules"

```bash
# Re-sync governance
sophia sync

# Check agent config
cat CLAUDE.md
```

---

## 📚 Learning Path

### Week 1: Basics
- [ ] Install Thalamus AI
- [ ] Create first project with `/build`
- [ ] Review auto-generated code
- [ ] Understand `sophia verify`

### Week 2: Workflows
- [ ] Use session management
- [ ] Set up Obsidian sync
- [ ] Customize policies
- [ ] Record first memory

### Week 3: Advanced
- [ ] Multi-project orchestration
- [ ] Custom agent definitions
- [ ] Evidence review workflows
- [ ] Team collaboration

---

## 💡 Pro Tips

### 1. Use `/build` for Everything

Don't just code — describe first. The spec becomes documentation.

### 2. Let AI Handle Boilerplate

Focus on architecture decisions, let agents implement.

### 3. Review Evidence, Not Just Code

Screen recordings show context that code doesn't.

### 4. Build Your Memory

The more corrections and patterns you record, the smarter the AI gets.

### 5. Trust the Gates

If Sophia blocks something, there's usually a good reason.

---

## 🤝 Community

- **Discord**: [join link]
- **GitHub Issues**: For bugs and features
- **Showcase**: Share your vibe-coded projects

---

## 🎯 Philosophy

> **"The best code is the code you don't have to write."**

Thalamus AI isn't about replacing developers — it's about amplifying them. You bring the vision and judgment; AI handles the execution.

**Vibe on.** 🎵

---

*Built with ❤️ by Thalamus AI*  
*Part of the Sophia Code ecosystem*
