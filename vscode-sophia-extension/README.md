# Sophia Code - Community Edition (VS Code Extension)

A VS Code extension that provides one-click setup for the **Sophia Code Community Edition** - completely free for single users!

## ✨ Community Edition Features

- ✅ **Full Governance Guardrails** - Trust scores, approval gates, artifact tracking
- ✅ **AI-Powered Code Review** - Integration with OpenCode, Anthropic, DeepSeek
- ✅ **Mission System** - Structured development with SDLC checkpoints
- ✅ **Artifact Management** - Intents, contracts, and gate definitions
- ✅ **One-Click Setup** - No Docker required!

## 🚀 What's Different About Community Edition?

| Feature | Community Edition | Paid Version |
|---------|-------------------|--------------|
| **Price** | Free | Paid subscription |
| **Users** | Single user only | Multi-user teams |
| **Database** | SQLite (file-based) | PostgreSQL |
| **Docker Required** | ❌ No | ✅ Yes |
| **Setup Time** | 3-5 minutes | 10-15 minutes |
| **Governance Features** | ✅ Full access | ✅ Full access |

## Requirements

Only three things needed:

1. **VS Code** (or compatible fork: Void, Cursor, etc.)
2. **Node.js** 18+ 
3. **Git**

**No Docker required!** The Community Edition uses SQLite which stores data in a simple file.

## Installation

### Method 1: Install from VSIX (For Testing)

1. Build the extension:
   ```bash
   cd vscode-sophia-extension
   npm install
   npm run compile
   npm run package
   ```

2. Install in VS Code:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Install from VSIX"
   - Select `sophia-code-0.1.0.vsix`

### Method 2: Development Mode

1. Open this folder in VS Code
2. Press `F5` to launch Extension Development Host
3. A new VS Code window will open with the extension loaded

## Usage

### First Time Setup

1. **Open the Setup Wizard:**
   - Click on the Sophia status bar item (bottom left)
   - Or press `Ctrl+Shift+P` and type "Sophia: Open Setup Wizard"

2. **Check Prerequisites:**
   - The wizard will check for Node.js and Git
   - No Docker check needed!

3. **Configure Project:**
   - Enter a project name
   - Choose installation location
   - Select "Auto-start services" (optional)

4. **Wait for Installation:**
   - The wizard will clone the repository
   - Install npm dependencies
   - Create environment files (SQLite configuration)

5. **Start Coding:**
   - Click "Open Sophia Dashboard" when complete
   - Or use the Control Center sidebar

### Daily Usage

After setup, use the **Control Center** sidebar (Sophia Code icon in Activity Bar):

- **Quick Actions:** Start/Stop/Restart services
- **Services:** View status of Backend, Frontend, and SQLite database
- **Open Dashboard:** Launch the Sophia web interface

### What Gets Started?

Community Edition starts **two services** (not three):

1. **Backend API** (Port 3000) - Includes SQLite database
2. **Frontend** (Port 5173) - The dashboard UI

The SQLite database is file-based and automatically created by the backend - no separate database service needed!

### Command Palette

All commands are prefixed with "Sophia:":

- `Sophia: Setup Environment` - Run the setup wizard
- `Sophia: Start All Services` - Start backend and frontend
- `Sophia: Stop All Services` - Stop running services
- `Sophia: Restart Services` - Restart services
- `Sophia: Open Dashboard` - Open the Sophia web interface
- `Sophia: Check Prerequisites` - Verify Node.js and Git

## Testing on Windows (Fresh Machine)

### Prerequisites to Install First:

1. **VS Code** from https://code.visualstudio.com/

2. **Node.js** from https://nodejs.org/ (LTS version)
   - Run the installer
   - Accept defaults
   - Restart VS Code after installation

3. **Git** from https://git-scm.com/download/win
   - Run the installer
   - Select "Git from the command line and also from 3rd-party software" when asked about PATH
   - Complete installation

### Then Install the Extension:

1. Build or download the VSIX file
2. Install in VS Code (Extensions → ... → Install from VSIX)
3. Click the Sophia status bar item
4. Follow the wizard (3-5 minutes)

### Verify It Works:

1. The Sophia dashboard should open at http://localhost:5173
2. Create your first Mission
3. Try the governance features
4. Your data is stored in: `your-project/backend/data/sophia.db`

## Troubleshooting

### "Node.js not found"
- Make sure Node.js is installed
- Restart VS Code after installing Node.js
- Try opening a terminal and running `node --version`

### "Git not found"
- Make sure Git is installed
- During Git install, select "Git from the command line..." for PATH option
- Restart VS Code

### "Port already in use"
- Ports 3000 (backend) or 5173 (frontend) may be in use
- Stop other applications using these ports
- Or change ports in the `.env` files

### "npm install fails"
- Check your internet connection
- Try running `npm install` manually in the terminal
- Clear npm cache: `npm cache clean --force`

### Extension doesn't appear
- Make sure the extension is enabled
- Check the Output panel for errors
- Reload VS Code window

## Data & Storage

**Where is my data stored?**

Community Edition uses SQLite, which stores everything in a single file:
```
your-project/
└── backend/
    └── data/
        └── sophia.db  ← Your data is here!
```

**How do I backup?**
- Just copy the `sophia.db` file!
- Or the entire `data/` folder

**How do I reset?**
- Delete the `sophia.db` file
- Restart services - a fresh database will be created

**Can I move my project?**
- Yes! The entire project folder is portable
- Your database moves with it

## Development

### Project Structure

```
vscode-sophia-extension/
├── src/
│   ├── extension.ts          # Entry point
│   ├── services/             # Business logic
│   │   ├── setup.ts          # Installation logic (SQLite config)
│   │   ├── serviceManager.ts # Start/stop services (no Docker)
│   │   └── terminal.ts       # Terminal management
│   ├── ui/
│   │   ├── setupWizard.ts    # Webview wizard
│   │   └── controlCenter.ts  # Sidebar tree view
│   └── utils/
│       ├── platform.ts       # OS detection
│       └── prerequisites.ts  # Prerequisite checks (no Docker)
├── package.json              # Extension manifest
└── tsconfig.json             # TypeScript config
```

### Building

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package as VSIX
npm run package
```

### Testing

1. Press `F5` in VS Code to open Extension Development Host
2. Test commands from Command Palette
3. Check Output panel for logs

## Upgrading to Paid Version

When you're ready for team features:

- Multi-user collaboration
- PostgreSQL database
- Advanced analytics
- Team governance policies
- Priority support

Visit [sophia-code.com](https://sophia-code.com) to upgrade!

## Contributing

This extension is part of the Sophia Code project. See the main repository for contribution guidelines.

## License

Same as Sophia Code project - Community Edition is free for single users.
