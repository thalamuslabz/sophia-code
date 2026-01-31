# Sophia Code - User Guide

Welcome to Sophia Code! This guide will help you understand and use all the features available in the application.

## Table of Contents

- [Getting Started](#getting-started)
- [Main Interface](#main-interface)
- [Working with Artifacts](#working-with-artifacts)
  - [Creating Artifacts](#creating-artifacts)
  - [Managing Artifacts](#managing-artifacts)
  - [Using Artifacts](#using-artifacts)
- [AI Integration](#ai-integration)
- [Governance Features](#governance-features)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tips and Best Practices](#tips-and-best-practices)

## Getting Started

After [installing](./INSTALL.md) and [setting up](./SETUP_GUIDE.md) Sophia Code, you'll be greeted with the main dashboard when you first open the application.

### Initial Configuration

1. Click on your profile icon in the top-right corner
2. Select "Settings" from the dropdown menu
3. Configure your user profile and preferences
4. Save your settings

## Main Interface

The Sophia Code interface consists of several key areas:

### Dashboard

The dashboard provides an overview of your artifacts, recent activities, and quick access to common functions. From here, you can:

- View recently created or updated artifacts
- See governance status and trust scores
- Access quick actions for common tasks

### Navigation

The left sidebar contains navigation options:

- **Home**: Return to the dashboard
- **Artifacts**: Browse and manage all artifacts
- **Missions**: View current and past missions
- **Governance**: Access governance settings and reports
- **Settings**: Configure application settings

## Working with Artifacts

Artifacts are the core building blocks in Sophia Code. They come in several types:

- **Intent**: Defines what an AI system should do
- **Gate**: Establishes governance checks and controls
- **Contract**: Formal agreements between components or systems

### Creating Artifacts

To create a new artifact:

1. Click the "+ New Artifact" button in the header
2. Select the artifact type (Intent, Gate, or Contract)
3. Fill out the required information:
   - **Title**: A clear, descriptive name
   - **Description**: Detailed explanation of the artifact's purpose
   - **Tags**: Keywords to categorize the artifact
   - **Type-specific fields**: Additional fields based on the artifact type
4. Click "Create Artifact"

### Managing Artifacts

To manage existing artifacts:

1. Go to the "Artifacts" section in the sidebar
2. Use the filters at the top to find specific artifacts
3. Click on an artifact card to view its details
4. From the detail view, you can:
   - **Edit**: Update the artifact's information
   - **Delete**: Remove the artifact (requires confirmation)
   - **Copy**: Create a duplicate of the artifact
   - **Export**: Download the artifact data

### Using Artifacts

Artifacts can be used in various ways depending on their type:

- **Intent artifacts** can be implemented in AI systems to define behavior
- **Gate artifacts** can be applied to workflows to enforce governance
- **Contract artifacts** can be referenced in system integrations to define expectations

To use an artifact:

1. Open the artifact details
2. Click on the "Use" button
3. Select how you want to use the artifact
4. Follow the prompts to complete the implementation

## AI Integration

Sophia Code integrates with multiple AI providers to enhance your workflow.

### Configuring AI Providers

See the [Setup Guide](./SETUP_GUIDE.md) for detailed instructions on configuring AI providers.

### Using AI Features

AI features are available throughout the application:

- **Smart Suggestions**: AI will suggest relevant artifacts based on your current context
- **Content Generation**: Get AI-generated descriptions and content for new artifacts
- **Validation**: AI helps validate artifacts against best practices and governance rules

To enable or disable specific AI features:

1. Go to Settings > AI Configuration
2. Toggle the features you want to enable/disable
3. Adjust confidence thresholds as needed

## Governance Features

Sophia Code includes robust governance features to ensure AI systems remain safe and compliant.

### Governance Gates

Gates provide checkpoints that can be triggered automatically:

- **PII Detection**: Flags potential personally identifiable information
- **Security Checks**: Identifies potential security issues
- **Destructive Actions**: Warns about potentially harmful operations
- **Budget Controls**: Manages cost limits for AI operations

### Trust Scores

Each artifact has a trust score that reflects its reliability and compliance:

- **90-100**: High trust, fully compliant
- **70-89**: Moderate trust, minor issues to address
- **Below 70**: Low trust, significant issues to address

To improve trust scores:

1. Address the specific issues highlighted in the artifact details
2. Run governance checks again to update the score
3. Document any exceptions or mitigations

## Keyboard Shortcuts

Sophia Code supports various keyboard shortcuts to speed up your workflow:

- **Ctrl+N/Cmd+N**: Create new artifact
- **Ctrl+F/Cmd+F**: Open search
- **Ctrl+S/Cmd+S**: Save current artifact
- **Ctrl+,/Cmd+,**: Open settings
- **Ctrl+H/Cmd+H**: Toggle help panel
- **Esc**: Close current dialog or panel

## VSCode Integration

Sophia Code integrates with VSCode to provide enhanced capabilities directly in your development environment.

### Installing the VSCode Extension

1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Sophia Code"
4. Click "Install"

### VSCode Features

The VSCode extension provides:

- **Code Suggestions**: Get AI-powered code suggestions as you type
- **Artifact References**: Reference and implement artifacts directly in your code
- **Governance Checks**: Run governance checks on your code
- **Command Palette**: Access Sophia Code features through the command palette (Ctrl+Shift+P / Cmd+Shift+P)

### Using Sophia Code in VSCode

1. Open a project in VSCode
2. Use the Sophia Code icon in the sidebar to access the extension
3. Sign in with your Sophia Code credentials
4. Start using the features directly in your development workflow

## Tips and Best Practices

- **Be specific in artifact descriptions**: Clear, detailed descriptions make artifacts more useful
- **Use consistent naming**: Establish naming conventions for your artifacts
- **Apply appropriate tags**: Good tagging makes artifacts easier to find
- **Document exceptions**: If you bypass governance gates, document why
- **Regular reviews**: Periodically review artifacts to ensure they remain relevant and accurate

## Troubleshooting

If you encounter issues:

- Check the application logs at Settings > Advanced > View Logs
- Verify your API provider configuration in Settings > AI Configuration
- Ensure your account has the necessary permissions for the actions you're trying to perform

For additional help, refer to the [Admin Guide](./ADMIN_GUIDE.md) or contact support.