# Sophia Code Extension Quickstart

## Testing the Extension

### Method 1: Extension Development Host (Recommended for Development)

1. Open this folder in VS Code
2. Press `F5` or click Run > Start Debugging
3. A new VS Code window opens with the extension loaded
4. Test the extension in this new window

### Method 2: Install from VSIX (Recommended for Testing)

1. Build the extension:
   ```bash
   npm install
   npm run compile
   npm run package
   ```

2. Install in VS Code:
   - Press `Ctrl+Shift+P`
   - Type "Install from VSIX"
   - Select `sophia-code-0.1.0.vsix`

## Testing on Fresh Windows Machine

1. Install VS Code from https://code.visualstudio.com/

2. Install prerequisites:
   - Node.js: https://nodejs.org/
   - Git: https://git-scm.com/download/win
   - Docker Desktop: https://www.docker.com/products/docker-desktop/

3. Restart computer after Docker install

4. Open VS Code and install the extension

5. Click the Sophia status bar item or run "Sophia: Open Setup Wizard"

6. Follow the wizard to complete setup

## Making Changes

1. Edit files in `src/`
2. Press `Ctrl+Shift+B` to compile
3. Press `F5` to test

## Packaging for Distribution

```bash
npm run package
```

This creates `sophia-code-0.1.0.vsix` for distribution.
