# Sophia Code - Setup Guide

This guide will walk you through the process of setting up Sophia Code with your preferred AI providers and configuring the application for optimal use.

## API Configuration

Sophia Code supports multiple AI providers. This section explains how to set up each provider.

### General Configuration

In your `.env` file, you can specify which AI provider to use:

```
VITE_AI_PROVIDER=deepseek  # Options: opencode, anthropic, deepseek, kimi
```

### Deepseek Configuration

To use Deepseek as your AI provider:

1. Sign up for an account at [Deepseek's website](https://deepseek.ai)
2. Navigate to your account settings to get your API key
3. Add the following to your `.env` file:

```
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
VITE_DEEPSEEK_API_ENDPOINT=https://api.deepseek.com/v1/chat/completions
```

### Kimi Code Configuration

To use Kimi Code as your AI provider:

1. Sign up for an account at [Kimi's website](https://kimi.ai)
2. Generate an API key from your account dashboard
3. Add the following to your `.env` file:

```
VITE_KIMI_API_KEY=your_kimi_api_key
VITE_KIMI_API_ENDPOINT=https://api.kimi.ai/v1/chat/completions
```

### Anthropic Configuration

To use Anthropic as your AI provider:

1. Sign up for an account at [Anthropic's website](https://www.anthropic.com)
2. Get your API key from your account settings
3. Add the following to your `.env` file:

```
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
VITE_ANTHROPIC_API_ENDPOINT=https://api.anthropic.com/v1/messages
```

### OpenCode Configuration

OpenCode is the default provider and doesn't require external API credentials. It's perfect for development and testing.

## Application Settings

### Backend Configuration

By default, Sophia Code uses a local backend running on port 3000. You can configure this in your `.env` file:

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_KEY=your_development_api_key
```

If you're using a remote backend, update the `VITE_API_BASE_URL` accordingly.

### VSCode Integration

Sophia Code integrates with VSCode to provide an enhanced development experience:

1. Install the [Sophia VSCode Extension](https://marketplace.visualstudio.com/items?itemName=sophia-ai.sophia-code)
2. Open VSCode settings (File > Preferences > Settings)
3. Search for "Sophia Code" and configure the following settings:
   - `sophiaCode.apiKey`: Your Sophia API key
   - `sophiaCode.provider`: Your preferred AI provider
   - `sophiaCode.autoSuggest`: Enable/disable code suggestions
   - `sophiaCode.highlightReferences`: Enable/disable automatic reference highlighting

4. Restart VSCode to apply the settings

### Additional Configuration Options

For advanced users, additional configuration options are available in the `config` directory:

- `governance.config.js`: Configure governance gates and security checks
- `ai.config.js`: Advanced AI provider settings
- `artifacts.config.js`: Customize artifact types and validation rules

## Testing Your Configuration

To verify your configuration is working:

1. Start the development server with `npm run dev`
2. Open your browser and navigate to `http://localhost:5173`
3. Click on the settings icon in the top-right corner
4. Select "Test Connection" for your configured AI provider
5. You should see a success message if everything is set up correctly

## Troubleshooting

### API Connection Issues

If you're having trouble connecting to your AI provider:

1. Verify your API key is correct and not expired
2. Check if your provider's API endpoint is accessible from your network
3. Look for any error messages in the browser console
4. Ensure you're using the correct API endpoint format for your provider

### VSCode Extension Issues

If the VSCode extension isn't working:

1. Make sure the extension is installed and enabled
2. Check the VSCode extension logs for errors
3. Verify the Sophia Code server is running while using the extension

## Next Steps

Now that you've set up Sophia Code, you're ready to start using it! Refer to the [User Guide](./USER_GUIDE.md) for detailed instructions on how to use all the features.