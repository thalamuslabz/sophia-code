# Auto-Claude Integration (Automated)

**Zero-configuration integration between Open WebUI and Auto-Claude**

---

## Overview

The Auto-Claude integration is now **fully automated** and runs silently as part of `sophia init`. When you initialize Sophia in a project:

1. ✅ Auto-Claude is auto-detected
2. ✅ Bridge service is installed and started
3. ✅ Open WebUI function is prepared
4. ✅ n8n workflow is ready to import
5. ✅ Everything runs in the background

**You don't need to manually start anything.**

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SOPHIA INIT (One-time setup)                                           │
│  ├── Detects Auto-Claude installation                                   │
│  ├── Installs bridge as system service (launchd/systemd)               │
│  ├── Service auto-starts on login                                       │
│  └── Configures spec directory watching                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  BACKGROUND SERVICE (Always running)                                    │
│  ├── launchd (macOS) or systemd (Linux)                                │
│  ├── Watches ~/.auto-claude/specs/                                      │
│  ├── Auto-restarts on crash                                             │
│  └── Logs to ~/.auto-claude/logs/                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
          ┌──────────────────┐          ┌──────────────────┐
          │ Open WebUI       │          │ Manual spec drop │
          │ /build command   │          │ (CLI/scripts)    │
          └────────┬─────────┘          └────────┬─────────┘
                   │                             │
                   └─────────────┬───────────────┘
                                 ▼
                    ┌────────────────────┐
                    │ Spec file created  │
                    │ ~/.auto-claude/    │
                    │   specs/*.json     │
                    └────────┬───────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Bridge detects file│
                    │ Process & route    │
                    │ to Auto-Claude     │
                    └────────────────────┘
```

---

## Usage

### For Users

#### 1. Initialize Project (Auto-Claude detected automatically)

```bash
cd my-project
sophia init
```

Output:
```
✓ Auto-Claude integration active

Next steps:
  sophia status              — View project status
  sophia sync                — Re-sync governance
  sophia auto-claude status  — Check integration
```

#### 2. Use in Open WebUI

```
You: Build me a React todo app with TypeScript that:
      - Adds/deletes todos
      - Filters by status
      - Stores in localStorage

You: /build

AI: 🚀 Build Spec Created
    ID: spec-20260216-react-todo-042
    Project: react-todo
    Auto-Claude will process automatically.
```

#### 3. Check Status

```bash
sophia auto-claude status
```

Output:
```
Auto-Claude Integration Status

Prerequisites:
  Auto-Claude installed: ✓
  Productivity Hub: ✓

Service Status:
  Bridge: running
  PID: 12345

Directories:
  Specs: ✓ /Users/you/.auto-claude/specs/
  Pending specs: 0

Configuration:
  Enabled: yes
  Trigger method: auto
  Use n8n: yes
```

---

## Commands

| Command | Description |
|---------|-------------|
| `sophia auto-claude status` | Check integration status |
| `sophia auto-claude logs` | View bridge logs |
| `sophia auto-claude logs -f` | Follow logs in real-time |
| `sophia auto-claude start` | Manually start service |
| `sophia auto-claude stop` | Stop service |
| `sophia auto-claude restart` | Restart service |
| `sophia auto-claude setup` | Re-run setup |

---

## Configuration

### Auto-Detection

The integration **auto-enables** when:
- Auto-Claude is installed (detected in common locations)
- Or: `~/.auto-claude/` directory exists

### Manual Configuration

Add to `.sophia/config.yaml`:

```yaml
# Auto-Claude Integration
auto_claude:
  enabled: true                    # Enable/disable
  spec_dir: "~/.auto-claude/specs" # Spec inbox
  processed_dir: "~/.auto-claude/processed"
  trigger_method: "auto"           # auto | cli | file | api
  auto_start: true                 # Start service automatically
  use_n8n: true                    # Route through n8n
  n8n_webhook_url: "http://localhost:3118/webhook/auto-claude-trigger"
```

### Environment Variables

Override defaults:

```bash
export AUTO_CLAUDE_ENABLED=true
export AUTO_CLAUDE_SPEC_DIR="~/custom/specs"
export AUTO_CLAUDE_TRIGGER_METHOD="file"
export AUTO_CLAUDE_USE_N8N="false"
```

---

## Service Management

### macOS (launchd)

```bash
# Check service status
launchctl list | grep com.thalamus.auto-claude-bridge

# View plist
cat ~/Library/LaunchAgents/com.thalamus.auto-claude-bridge.plist

# Manual control
launchctl load ~/Library/LaunchAgents/com.thalamus.auto-claude-bridge.plist
launchctl unload ~/Library/LaunchAgents/com.thalamus.auto-claude-bridge.plist
```

**Features:**
- ✅ Auto-starts on login
- ✅ Auto-restarts on crash
- ✅ Throttles restarts (10s interval)
- ✅ Logs to `~/.auto-claude/logs/`

### Linux (systemd)

```bash
# Check status
systemctl --user status auto-claude-bridge

# Manual control
systemctl --user start auto-claude-bridge
systemctl --user stop auto-claude-bridge
systemctl --user restart auto-claude-bridge

# View logs
journalctl --user -u auto-claude-bridge -f
```

**Features:**
- ✅ User-level service (no sudo needed)
- ✅ Auto-starts on login
- ✅ Auto-restarts on failure
- ✅ Integrated with systemd journal

---

## Troubleshooting

### Service won't start

```bash
# Check logs
sophia auto-claude logs

# Verify node is available
which node
node --version

# Try manual start to see errors
node ~/.sophia/scripts/auto-claude-bridge.js --watch --verbose
```

### Specs not being processed

```bash
# Check if service is running
sophia auto-claude status

# Verify spec directory exists
ls -la ~/.auto-claude/specs/

# Check file permissions
ls -la ~/.auto-claude/

# Restart service
sophia auto-claude restart
```

### Open WebUI not triggering

1. Verify function is installed:
   ```bash
   ls ~/.sophia/openwebui-functions/
   ```

2. Check Open WebUI logs:
   ```bash
   docker logs ops-openwebui 2>&1 | grep -i "auto.claude"
   ```

3. Re-install function:
   ```bash
   sophia auto-claude setup --openwebui
   ```

---

## File Locations

| Component | Path |
|-----------|------|
| Bridge script | `~/.sophia/scripts/auto-claude-bridge.js` |
| Service config (macOS) | `~/Library/LaunchAgents/com.thalamus.auto-claude-bridge.plist` |
| Service config (Linux) | `~/.config/systemd/user/auto-claude-bridge.service` |
| Spec inbox | `~/.auto-claude/specs/` |
| Processed specs | `~/.auto-claude/processed/` |
| Logs | `~/.auto-claude/logs/bridge.log` |
| Open WebUI function | `~/.sophia/openwebui-functions/` |
| n8n workflow | `~/.sophia/n8n-workflows/` |

---

## Integration Flow

### 1. New Project Setup

```bash
mkdir my-app && cd my-app
sophia init --yes
```

**Behind the scenes:**
1. Project detected (React/Node)
2. `.sophia/` directory created
3. Agent configs generated
4. Auto-Claude detected → Integration enabled
5. Bridge service installed & started
6. Open WebUI function prepared
7. n8n workflow ready

### 2. Daily Usage

**Developer workflow:**

```
1. Open Open WebUI (localhost:3115)
   └── Document feature requirements

2. Type: "/build Create user auth system"
   └── Spec generated
   └── Saved to ~/.auto-claude/specs/

3. Bridge detects file (within seconds)
   └── Routes to Auto-Claude
   └── Creates Thalamus intent

4. Auto-Claude spawns agents
   └── Parallel development
   └── Screen recordings captured

5. Evidence synced back
   └── Obsidian documentation
   └── Leantime task updates
   └── Thalamus dashboard
```

---

## Migration from Manual Setup

If you previously used the manual setup:

```bash
# 1. Stop old bridge (if running manually)
Ctrl+C in terminal

# 2. Run new automated setup
sophia auto-claude setup

# 3. Verify service is running
sophia auto-claude status

# 4. Remove old manual process
# (Edit crontab, remove from .bashrc, etc.)
```

---

## Advanced

### Custom Bridge Script

Replace the embedded bridge with custom implementation:

```bash
# Create custom bridge
cat > ~/.sophia/scripts/auto-claude-bridge.js << 'EOF'
#!/usr/bin/env node
// Your custom bridge logic
console.log("Custom bridge running...");
EOF

# Restart service
sophia auto-claude restart
```

### Multiple Spec Directories

Edit service configuration directly:

**macOS:**
```bash
# Edit plist
vim ~/Library/LaunchAgents/com.thalamus.auto-claude-bridge.plist

# Reload
launchctl unload ~/Library/LaunchAgents/com.thalamus.auto-claude-bridge.plist
launchctl load ~/Library/LaunchAgents/com.thalamus.auto-claude-bridge.plist
```

**Linux:**
```bash
# Edit service
vim ~/.config/systemd/user/auto-claude-bridge.service

# Reload
systemctl --user daemon-reload
systemctl --user restart auto-claude-bridge
```

---

## Summary

| Aspect | Before | After (Automated) |
|--------|--------|-------------------|
| Setup | Manual script execution | Part of `sophia init` |
| Bridge start | Manual terminal command | Auto-starting service |
| Monitoring | Watch terminal | Background daemon |
| Logs | Console output | Structured log files |
| Restart on crash | Manual | Automatic |
| Login persistence | None | launchd/systemd |
| Open WebUI | Manual install | Prepared automatically |
| n8n workflow | Manual import | Ready to activate |

**Result:** Set it up once with `sophia init`, then forget about it. The integration just works.

---

*Part of Sophia Code - Automated governance for AI-assisted development*
