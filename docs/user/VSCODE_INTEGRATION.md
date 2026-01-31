# Sophia Code - VSCode Integration Guide

This guide explains how to use the Sophia Code VSCode extension to enhance your development workflow.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Features](#features)
- [Commands and Shortcuts](#commands-and-shortcuts)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

## Installation

### Prerequisites

Before installing the Sophia Code VSCode extension, ensure you have:

- VSCode version 1.60.0 or higher
- A Sophia Code account (free or paid)
- Sophia Code application installed locally or access to a remote instance

### Installation Steps

1. Open VSCode
2. Go to the Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Sophia Code"
4. Click "Install" on the Sophia Code extension
5. Once installed, click "Reload" to activate the extension

## Configuration

### Initial Setup

1. After installation, you'll be prompted to log in to your Sophia Code account
2. Click "Sign In" and follow the authentication process
3. If not prompted automatically, you can initiate login by:
   - Opening the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Typing "Sophia Code: Sign In"
   - Pressing Enter

### Extension Settings

Configure the extension in VSCode settings:

1. Open VSCode settings (File > Preferences > Settings)
2. Search for "Sophia Code"
3. Adjust the following settings as needed:

#### General Settings

- `sophiaCode.enabled`: Enable/disable the extension
- `sophiaCode.autoStartServer`: Automatically start the Sophia Code server
- `sophiaCode.showStatusBarItem`: Show/hide the status bar item

#### AI Provider Settings

- `sophiaCode.aiProvider`: Select the AI provider to use (deepseek, kimi, anthropic, opencode)
- `sophiaCode.apiKey`: Your AI provider API key
- `sophiaCode.apiEndpoint`: Custom API endpoint (if applicable)

#### Feature Settings

- `sophiaCode.autoSuggest.enabled`: Enable/disable code suggestions
- `sophiaCode.governance.enabled`: Enable/disable governance checks
- `sophiaCode.artifactIntegration.enabled`: Enable/disable artifact integration

## Features

### AI-Assisted Coding

The Sophia Code extension provides intelligent coding assistance:

#### Code Suggestions

As you type, Sophia Code will provide contextual code suggestions:

1. Type as normal in your code editor
2. Sophia Code will analyze your code in real-time
3. Suggestions appear as ghost text or in the suggestion panel
4. Press Tab to accept a suggestion or Esc to dismiss it

#### Code Explanations

Get explanations for complex code:

1. Select a code block
2. Right-click and select "Sophia Code: Explain Code"
3. View the explanation in the sidebar panel

### Artifact Integration

Work with Sophia Code artifacts directly in VSCode:

#### Browsing Artifacts

1. Open the Sophia Code sidebar (click the Sophia icon in the activity bar)
2. Browse available artifacts by type or search for specific ones
3. Click on an artifact to view its details

#### Using Artifacts in Code

1. In your code, type `// sophia:artifact`
2. Select the artifact you want to reference
3. The artifact will be inserted as a comment with relevant metadata

### Governance Checks

Run governance checks on your code:

1. Open the command palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Type "Sophia Code: Run Governance Check"
3. View governance issues in the Problems panel
4. Click on issues to see details and recommendations

## Commands and Shortcuts

The Sophia Code extension provides several commands:

### Command Palette Commands

Access these via Ctrl+Shift+P / Cmd+Shift+P:

- `Sophia Code: Sign In`: Authenticate with your account
- `Sophia Code: Sign Out`: Sign out from your account
- `Sophia Code: Open Dashboard`: Open the Sophia Code web dashboard
- `Sophia Code: Run Governance Check`: Analyze code for governance issues
- `Sophia Code: Generate Documentation`: Generate documentation for selected code
- `Sophia Code: Browse Artifacts`: Open the artifact browser
- `Sophia Code: Create Artifact`: Create a new artifact from selected code

### Keyboard Shortcuts

Default keyboard shortcuts (customizable in VSCode keyboard settings):

- `Alt+S C`: Run governance check
- `Alt+S G`: Generate documentation
- `Alt+S A`: Browse artifacts
- `Alt+S N`: Create new artifact
- `Alt+S E`: Explain selected code

## Troubleshooting

### Common Issues

#### Extension Not Activating

If the extension doesn't activate:

1. Check VSCode's Output panel (View > Output)
2. Select "Sophia Code" from the dropdown
3. Look for error messages
4. Ensure you have the required VSCode version (1.60.0+)
5. Try reinstalling the extension

#### Authentication Problems

If you can't authenticate:

1. Check your internet connection
2. Verify your Sophia Code account credentials
3. Try signing out and back in
4. Check if your account has the necessary permissions
5. Look for firewall or network restrictions

#### Feature Not Working

If a specific feature isn't working:

1. Check if the feature is enabled in settings
2. Verify your AI provider configuration
3. Check VSCode's Console (Help > Toggle Developer Tools) for JavaScript errors
4. Try reloading VSCode
5. Ensure the Sophia Code server is running

## Advanced Configuration

### Custom AI Provider Setup

For advanced AI provider configuration:

1. Create a `.sophia-vscode` file in your project root
2. Add the following JSON configuration:
   ```json
   {
     "aiProvider": {
       "type": "custom",
       "endpoint": "https://your-custom-endpoint.com/api",
       "headers": {
         "Authorization": "Bearer your-api-key",
         "Custom-Header": "custom-value"
       }
     }
   }
   ```
3. Restart VSCode or reload the window

### Project-Specific Settings

Configure per-project settings:

1. Open your workspace settings (File > Preferences > Settings > Workspace)
2. Configure Sophia Code settings specifically for the current project
3. These will override global settings when working in this project

### Extension API Integration

For developers who want to integrate with the Sophia Code extension API:

1. Install the Sophia Code API package:
   ```bash
   npm install --save @sophia-code/vscode-api
   ```

2. Import and use the API in your extension:
   ```javascript
   const sophiaApi = require('@sophia-code/vscode-api');

   // Example: Run a governance check
   sophiaApi.runGovernanceCheck(document.getText()).then(results => {
     console.log(results);
   });
   ```

## Additional Resources

- [VSCode Extension Documentation](https://marketplace.visualstudio.com/items?itemName=sophia-ai.sophia-code)
- [API Reference](https://docs.sophia-code.ai/api/vscode)
- [GitHub Repository](https://github.com/sophia-ai/vscode-extension)
- [Issue Tracker](https://github.com/sophia-ai/vscode-extension/issues)