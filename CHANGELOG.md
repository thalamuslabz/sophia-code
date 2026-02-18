# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial unified repository structure
- One-command installer (`./install.sh`)
- Docker Compose for full stack deployment
- Vibe Coder's Guide for beginners
- GitHub Actions CI/CD workflows
- Makefile for convenience commands

## [1.0.0] - 2024-02-17

### Added

#### Core Platform
- **Sophia CLI** - Governance-first development tool
  - Policy enforcement (security, quality, testing)
  - Session management and file claiming
  - Agent configuration injection
  - Memory system for corrections and patterns
  - Health scoring
  
- **Shared Package** - Common types and schemas
  - TypeScript definitions
  - Zod validation schemas
  - System constants
  
- **Dashboard** - Next.js governance UI
  - Real-time project health monitoring
  - Session and claim visualization
  - Policy browser
  - Activity bulletin
  
- **Orchestrator** - Build management system
  - Intent registry
  - Approval workflow
  - Evidence vault
  - Docker-based build agents

#### Integrations
- **Open WebUI** - AI chat interface
- **n8n** - Workflow automation
- **Auto-Claude** - AI agent execution
- **Obsidian** - Documentation sync
- **Leantime** - Project management

#### Features
- Intent-driven development workflow
- `/build` command for spec generation
- Multi-agent support (Claude Code, OpenCode, Cursor, Copilot)
- Automated policy enforcement
- Screen recording and evidence capture
- Auto-sync to documentation
- Git hooks for pre-commit validation

### Security
- Hardcoded secret detection
- .env file commit prevention
- Input validation requirements
- File size limits
- Session isolation

---

## Release Notes Template

```
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```
