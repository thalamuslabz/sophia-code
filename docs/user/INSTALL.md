# Sophia Code - Installation Guide

This guide will walk you through the process of installing and setting up Sophia Code on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Git** (v2.30.0 or higher)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-organization/sophia.code.git
cd sophia.code
```

### 2. Install Dependencies

Using npm:

```bash
npm install
```

Or, if you prefer yarn:

```bash
yarn install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory of the project with the following content:

```
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_KEY=your_development_api_key

# AI Provider Configuration
VITE_AI_PROVIDER=deepseek  # Options: opencode, anthropic, deepseek, kimi
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
VITE_DEEPSEEK_API_ENDPOINT=https://api.deepseek.com/v1/chat/completions

# Optional: Kimi Code Configuration
VITE_KIMI_API_KEY=your_kimi_api_key
VITE_KIMI_API_ENDPOINT=https://api.kimi.ai/v1/chat/completions
```

> Note: Replace the placeholder values with your actual API keys. For development purposes, you can use "opencode" as the AI provider which doesn't require an external API key.

### 4. Start the Development Server

```bash
npm run dev
```

Or with yarn:

```bash
yarn dev
```

This will start the development server at `http://localhost:5173`.

### 5. Build for Production (Optional)

If you want to build the application for production:

```bash
npm run build
```

Or with yarn:

```bash
yarn build
```

The built files will be in the `dist` directory.

## Troubleshooting

If you encounter any issues during installation:

1. **Node.js version issues**: Ensure you're using Node.js v18 or higher. You can use [nvm](https://github.com/nvm-sh/nvm) to manage multiple Node.js versions.

2. **Dependency conflicts**: Try clearing npm cache and reinstalling:
   ```bash
   npm cache clean --force
   npm install
   ```

3. **Environment variables not loading**: Make sure your `.env` file is in the root directory and not `.env.local` or another variant.

4. **Port conflicts**: If port 5173 is already in use, you can modify the port in `vite.config.js`.

## Next Steps

After installation, refer to the [User Guide](./USER_GUIDE.md) to learn how to use Sophia Code effectively.