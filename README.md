<div align="center">

# 🧠 Thalamus AI

**The vibe coder's complete development environment.**

[![Version](https://img.shields.io/badge/version-1.0.0-00D9FF.svg?style=flat-square)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/License-MIT-00D9FF.svg?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/Node-18+-43853D.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat-square&logo=docker)](https://docker.com/)

**Describe what you want. Let AI handle the rest. Stay in control.**

[Quick Start](#quick-start) • [Documentation](#documentation) • [Examples](#examples) • [Contributing](#contributing)

</div>

---

## 🎯 What is This?

Thalamus AI is a **complete, integrated development environment** for vibe coders — developers who want to:

1. **Describe** what they want in natural language
2. **Review** AI-generated implementations
3. **Approve** with confidence (governance enforced)
4. **Ship** faster with full audit trails

### The Vibe Coding Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Describe  │────▶│    Build    │────▶│    Review   │────▶│    Ship     │
│             │     │             │     │             │     │             │
│ "Build auth │     │ AI agents   │     │ Screen      │     │ Merge with  │
│  system"    │     │ implement   │     │ recordings  │     │ confidence  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  Open WebUI          Auto-Claude         Evidence           Obsidian
  (chat)              (execution)         (audit trail)      (docs sync)
```

---

## 🚀 Quick Start

### One-Command Install

```bash
git clone https://github.com/thalamus-ai/thalamus-ai.git
cd thalamus-ai
./install.sh
```

**Requirements:**
- Node.js 18+ 
- Docker Desktop (optional, recommended)

That's it. The installer sets up everything.

### Your First Build

```bash
# 1. Open the chat interface
open http://localhost:3115

# 2. Type your request and /build command
"Create a React todo app with TypeScript and localStorage"
/build

# 3. Watch the dashboard
open http://localhost:9473
```

---

## 🏗️ What's Included

### Core Components

| Component | Purpose | URL |
|-----------|---------|-----|
| **Sophia CLI** | Governance, policies, session management | `sophia` |
| **Open WebUI** | AI chat interface | http://localhost:3115 |
| **n8n** | Workflow automation | http://localhost:3118 |
| **Orchestrator** | Build management, intent registry | http://localhost:7654 |
| **Dashboard** | Project health, sessions, policies | http://localhost:9473 |
| **Leantime** | Project management | http://localhost:8081 |
| **Qdrant** | Vector search | http://localhost:6333 |

### Features

- ✅ **Intent-Driven Development** — Describe features, get implementations
- ✅ **Governed AI** — Security policies enforced automatically
- ✅ **Session Management** — Track AI work, prevent conflicts
- ✅ **Evidence Recording** — Screen captures, audit trails
- ✅ **📚 Auto Documentation** — Syncs to Obsidian automatically
- ✅ **📊 Project Management** — Leantime ticket integration
- ✅ **🔍 Semantic Search** — Qdrant vector search across all docs
- ✅ **Policy Enforcement** — Blocks secrets, enforces standards
- ✅ **Memory System** — AI learns from corrections

---

## 📖 Documentation

| Guide | For | Description |
|-------|-----|-------------|
| [Vibe Coder's Guide](./docs/VIBE_CODER_GUIDE.md) | 🎵 Everyone | Start here — complete beginner guide |
| [Architecture](./docs/ARCHITECTURE.md) | 🏗️ Developers | System design and components |
| [CLI Reference](./docs/CLI_REFERENCE.md) | ⌨️ Power users | All `sophia` commands |
| [Policy Guide](./docs/POLICY_GUIDE.md) | 🛡️ Teams | Customizing governance |
| [Self-Hosting](./docs/SELF_HOSTING.md) | ☁️ Admins | Production deployment |

---

## 💻 Examples

### Basic Usage

```bash
# Initialize Sophia in a project
cd my-project
sophia init

# Start a development session
sophia session start --intent "Add user authentication"

# Claim files to work on
sophia session claim "src/auth/**"

# Check governance before commit
sophia verify
```

### AI-Assisted Development

```bash
# In Open WebUI (http://localhost:3115)
> Build a REST API with Express that:
>   - Has CRUD endpoints for users
>   - Uses JWT authentication
>   - Includes input validation
>   - Has unit tests
> /build

# AI agents will:
# 1. Generate structured spec
# 2. Create implementation plan
# 3. Write code following policies
# 4. Run tests
# 5. Record evidence
# 6. Sync documentation
```

---

## 🛡️ Security & Governance

Thalamus automatically enforces:

| Policy | What It Does |
|--------|--------------|
| **No Secrets** | Blocks hardcoded API keys, tokens |
| **No .env Commits** | Prevents secret files in git |
| **Input Validation** | Requires validation on API endpoints |
| **Test Coverage** | Warns on new code without tests |
| **Code Quality** | Enforces lint rules, type checking |

Policies are customizable per project. See [Policy Guide](./docs/POLICY_GUIDE.md).

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         THALAMUS AI STACK                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PRESENTATION LAYER                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Open WebUI  │  │   Dashboard  │  │     n8n      │  │  VS Code Ext │ │
│  │  (Chat)      │  │  (Governance)│  │ (Workflows)  │  │  (IDE Integ) │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                 │                 │         │
├─────────┴─────────────────┴─────────────────┴─────────────────┴─────────┤
│  ORCHESTRATION LAYER                                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Thalamus Orchestrator                           │  │
│  │   Intent Registry • Build Management • Evidence Vault              │  │
│  └─────────────────────────────┬─────────────────────────────────────┘  │
│                                │                                         │
├────────────────────────────────┼────────────────────────────────────────┤
│  GOVERNANCE LAYER              │                                         │
│  ┌─────────────────────────────┼─────────────────────────────────────┐  │
│  │                    Sophia Code (CLI + Core)                        │  │
│  │   Policy Engine • Session Manager • Memory System • Health Score   │  │
│  └─────────────────────────────┬─────────────────────────────────────┘  │
│                                │ validates & governs                     │
├────────────────────────────────┼────────────────────────────────────────┤
│  EXECUTION LAYER               ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    AI Agents (Auto-Claude, etc.)                   │  │
│  │   Code Generation • Testing • Documentation • Evidence Capture     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone and install
git clone https://github.com/thalamus-ai/thalamus-ai.git
cd thalamus-ai
npm run setup:dev

# Run tests
npm test

# Run specific package tests
cd packages/cli && npm test
```

---

## 🗺️ Roadmap

- [ ] Multi-model support (GPT-4, Claude, local LLMs)
- [ ] GitHub/GitLab integration
- [ ] Team collaboration features
- [ ] Mobile app for approvals
- [ ] Custom agent marketplace
- [ ] AI-powered code review

---

## 📜 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

- [Open WebUI](https://github.com/open-webui/open-webui) — Chat interface
- [n8n](https://n8n.io/) — Workflow automation
- [Claude Code](https://github.com/anthropics/claude-code) — AI agent inspiration
- [Auto-Claude](https://github.com/thalamus-ai/auto-claude) — Agent execution

---

<div align="center">

**Built with ❤️ by Thalamus AI**

[Website](https://thalamus.ai) • [Discord](https://discord.gg/thalamus) • [Twitter](https://twitter.com/thalamusai)

*Vibe on.* 🎵

</div>
