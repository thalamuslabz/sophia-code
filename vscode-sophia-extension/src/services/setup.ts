import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TerminalService } from './terminal';
import { checkAllPrerequisites, PrerequisitesResult } from '../utils/prerequisites';
import { getDefaultInstallPath, isWindows } from '../utils/platform';

const SOPHIA_REPO = 'https://github.com/TheMethodArq/sophia.code.git';

export interface SetupOptions {
  installPath: string;
  projectName: string;
  autoStart: boolean;
}

export interface SetupProgress {
  step: number;
  totalSteps: number;
  message: string;
  details?: string;
}

export class SetupService {
  private terminalService: TerminalService;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.terminalService = new TerminalService();
  }

  async checkPrerequisites(isCommunityEdition: boolean = true): Promise<PrerequisitesResult> {
    return await checkAllPrerequisites(isCommunityEdition);
  }

  async runSetup(
    options: SetupOptions,
    onProgress: (progress: SetupProgress) => void
  ): Promise<boolean> {
    const { installPath, projectName } = options;
    const projectPath = path.join(installPath, projectName);

    try {
      // Step 1: Check prerequisites
      onProgress({
        step: 1,
        totalSteps: 6,
        message: 'Checking prerequisites...',
        details: 'Verifying Node.js and Git are installed (Docker not required for Community Edition)'
      });

      const prereqs = await this.checkPrerequisites();
      if (!prereqs.allInstalled) {
        throw new Error('Prerequisites check failed. Please install missing requirements.');
      }

      // Step 2: Create directory
      onProgress({
        step: 2,
        totalSteps: 6,
        message: 'Creating project directory...',
        details: projectPath
      });

      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
      }

      // Step 3: Clone repository
      onProgress({
        step: 3,
        totalSteps: 6,
        message: 'Downloading Sophia Code...',
        details: 'This may take a few minutes'
      });

      await this.terminalService.runCommand(
        'Setup',
        `git clone ${SOPHIA_REPO} "${path.join(projectPath, 'sophia.code')}"`,
        projectPath,
        false
      );

      const sophiaCodePath = path.join(projectPath, 'sophia.code');
      
      // Wait for clone to complete
      await this.waitForClone(sophiaCodePath);

      // Step 4: Install frontend dependencies
      onProgress({
        step: 4,
        totalSteps: 6,
        message: 'Installing frontend dependencies...',
        details: 'Installing npm packages (this may take 2-3 minutes)'
      });

      await this.terminalService.runCommand(
        'Setup',
        'npm install',
        sophiaCodePath,
        false
      );

      // Wait for npm install to start
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 5: Install backend dependencies
      onProgress({
        step: 5,
        totalSteps: 6,
        message: 'Installing backend dependencies...',
        details: 'Installing server packages'
      });

      await this.terminalService.runCommand(
        'Setup',
        'npm install',
        path.join(sophiaCodePath, 'backend'),
        false
      );

      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 6: Create environment files
      onProgress({
        step: 6,
        totalSteps: 6,
        message: 'Configuring environment...',
        details: 'Creating configuration files'
      });

      await this.createEnvironmentFiles(sophiaCodePath);

      // Save configuration
      await this.context.globalState.update('sophia.installed', true);
      await this.context.globalState.update('sophia.installPath', sophiaCodePath);

      onProgress({
        step: 6,
        totalSteps: 6,
        message: 'Setup complete!',
        details: 'Sophia Code is ready to use'
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onProgress({
        step: 0,
        totalSteps: 6,
        message: 'Setup failed',
        details: errorMessage
      });
      return false;
    }
  }

  private async waitForClone(targetPath: string, timeoutMs: number = 120000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      // Check if the .git folder exists (clone completed)
      if (fs.existsSync(path.join(targetPath, '.git'))) {
        // Also wait for npm install to potentially complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Clone operation timed out');
  }

  private async createEnvironmentFiles(projectPath: string): Promise<void> {
    // Frontend .env - Community Edition
    const frontendEnv = `# Frontend environment - Community Edition
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_KEY=test_key_for_development_only
VITE_AI_PROVIDER=opencode

# Optional: Add your AI provider API key
# VITE_ANTHROPIC_API_KEY=your_key_here
# VITE_DEEPSEEK_API_KEY=your_key_here
`;

    // Backend .env - Community Edition (SQLite - no Docker needed)
    const backendEnv = `# Backend environment - Community Edition (Single User)
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database - SQLite (file-based, no Docker required)
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/sophia.db

# Auth
API_KEY=test_key_for_development_only

# Community Edition flags
IS_COMMUNITY_EDITION=true
MAX_USERS=1
`;

    fs.writeFileSync(path.join(projectPath, '.env'), frontendEnv);
    fs.writeFileSync(path.join(projectPath, 'backend', '.env'), backendEnv);
    
    // Create data directory for SQLite
    const dataDir = path.join(projectPath, 'backend', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  getInstallPath(): string | undefined {
    return this.context.globalState.get<string>('sophia.installPath');
  }

  isInstalled(): boolean {
    return this.context.globalState.get<boolean>('sophia.installed', false);
  }

  dispose(): void {
    this.terminalService.disposeAll();
  }
}
