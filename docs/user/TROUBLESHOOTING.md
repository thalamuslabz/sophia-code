# Sophia Code - Troubleshooting Guide

This guide will help you diagnose and fix common issues you may encounter when using Sophia Code.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Connection Problems](#connection-problems)
- [API Integration Issues](#api-integration-issues)
- [Performance Problems](#performance-problems)
- [User Interface Issues](#user-interface-issues)
- [VSCode Integration Issues](#vscode-integration-issues)
- [Error Messages](#common-error-messages)
- [Getting Help](#getting-help)

## Installation Issues

### Node.js Version Errors

**Problem**: Error messages about incompatible Node.js version.

**Solution**:
1. Check your Node.js version with `node --version`
2. Install Node.js v18 or higher:
   ```bash
   # Using nvm (recommended)
   nvm install 18
   nvm use 18

   # Or download directly from nodejs.org
   ```
3. Retry the installation

### Package Dependency Errors

**Problem**: Errors during `npm install` about dependency conflicts or missing packages.

**Solution**:
1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```
2. Delete `node_modules` folder and `package-lock.json`:
   ```bash
   rm -rf node_modules package-lock.json
   ```
3. Retry installation:
   ```bash
   npm install
   ```

### Build Failures

**Problem**: The application fails to build with errors in the console.

**Solution**:
1. Check for TypeScript errors
2. Ensure all required environment variables are set
3. Update to the latest repository version:
   ```bash
   git pull origin main
   npm install
   ```
4. Try building with verbose logging:
   ```bash
   npm run build -- --verbose
   ```

## Connection Problems

### API Connection Failures

**Problem**: Cannot connect to the backend API server.

**Solution**:
1. Verify the API server is running
2. Check your `.env` file has the correct `VITE_API_BASE_URL` value
3. Ensure your network allows connections to the API endpoint
4. Check browser console for specific error messages

### AI Provider Connection Issues

**Problem**: Cannot connect to the configured AI provider.

**Solution**:
1. Verify your API key is correct in the `.env` file
2. Check if your API key has expired or has usage limits
3. Ensure the AI provider's service is operational
4. Try switching to a different provider temporarily (e.g., OpenCode for testing)
5. Check your network configuration for any firewall rules blocking the connection

## API Integration Issues

### Invalid API Key Errors

**Problem**: Receiving "Invalid API Key" errors when connecting to an AI provider.

**Solution**:
1. Double-check your API key for typos
2. Regenerate a new API key from your provider's dashboard
3. Make sure you're using the correct environment variable name
4. Check if the API key has the required permissions

### Rate Limit Exceeded

**Problem**: Receiving rate limit errors from the AI provider.

**Solution**:
1. Implement retry logic with exponential backoff
2. Reduce the frequency of API calls
3. Upgrade your API plan if possible
4. Implement caching for common requests

## Performance Problems

### Slow Application Startup

**Problem**: The application takes a long time to start or load initially.

**Solution**:
1. Check your system resources (CPU, memory)
2. Close other resource-intensive applications
3. Clear browser cache and reload
4. Try disabling AI features temporarily
5. Check network latency to API servers

### UI Lag or Freezing

**Problem**: The interface becomes unresponsive or lags during use.

**Solution**:
1. Check browser console for errors
2. Reduce the number of artifacts loaded at once
3. Clear application data and cache
4. Try a different browser
5. Disable browser extensions that might interfere

## User Interface Issues

### Display Rendering Problems

**Problem**: UI elements are misaligned or not displaying correctly.

**Solution**:
1. Try a hard refresh (Ctrl+F5 / Cmd+Shift+R)
2. Clear browser cache and cookies
3. Try a different browser
4. Check if your browser is up to date
5. Disable custom CSS or browser extensions

### Form Submission Failures

**Problem**: Cannot submit forms or changes are not saved.

**Solution**:
1. Check form validation errors
2. Ensure all required fields are completed
3. Check browser console for error messages
4. Verify your connection to the backend
5. Try logging out and back in

## VSCode Integration Issues

### Extension Not Loading

**Problem**: The Sophia Code VSCode extension doesn't load or appear in the sidebar.

**Solution**:
1. Verify the extension is installed correctly
2. Check VSCode extensions panel for error messages
3. Reload VSCode (`Developer: Reload Window` in the command palette)
4. Reinstall the extension
5. Check VSCode logs for error messages

### Authentication Issues

**Problem**: Cannot authenticate with the Sophia Code extension.

**Solution**:
1. Verify your credentials
2. Check if the Sophia Code server is running
3. Reset your authentication token
4. Update to the latest extension version
5. Check VSCode network settings

### Feature Unavailability

**Problem**: Some features are not available or not working in VSCode.

**Solution**:
1. Check extension settings
2. Ensure the required feature is enabled in your account
3. Verify VSCode version compatibility
4. Check for feature flags or beta settings
5. Update to the latest extension version

## Common Error Messages

### "Failed to fetch artifacts"

**Problem**: Error when trying to load artifacts from the backend.

**Solution**:
1. Check your backend connection
2. Verify API key permissions
3. Check if the backend server is running
4. Look for more specific error messages in the console
5. Retry with a smaller query or filter

### "Governance gate triggered"

**Problem**: An operation was blocked by a governance gate.

**Solution**:
1. Review the governance rule that was triggered
2. Address the specific issue (e.g., PII detection, security check)
3. Request approval if appropriate
4. Adjust governance settings if the rule is too strict
5. Document any exceptions

### "AI provider unavailable"

**Problem**: Cannot connect to the configured AI provider.

**Solution**:
1. Check provider status
2. Verify API key and configuration
3. Switch to a fallback provider temporarily
4. Check network connectivity
5. Look for rate limiting or quota issues

## Getting Help

If you've tried the troubleshooting steps and still encounter issues:

1. **Check the logs**: Look in the browser console and application logs
2. **Search documentation**: Review the full documentation for specific guidance
3. **Community forums**: Post your issue with detailed steps to reproduce
4. **Issue tracker**: Submit a bug report on the GitHub repository
5. **Support contact**: For enterprise users, contact your dedicated support channel

Include the following information when seeking help:

- Sophia Code version
- Browser type and version
- Operating system
- Error messages (exact text)
- Steps to reproduce the issue
- Screenshots if applicable