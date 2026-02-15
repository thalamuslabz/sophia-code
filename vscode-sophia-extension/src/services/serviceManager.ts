import * as vscode from 'vscode';
import * as path from 'path';
import { TerminalService } from './terminal';
import { isWindows } from '../utils/platform';

export interface ServiceStatus {
  name: string;
  running: boolean;
  port?: number;
  url?: string;
  description?: string;
}

export class ServiceManager {
  private terminalService: TerminalService;
  private context: vscode.ExtensionContext;
  private serviceStatus: Map<string, boolean> = new Map();

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.terminalService = new TerminalService();
  }

  private getProjectPath(): string | undefined {
    return this.context.globalState.get<string>('sophia.installPath');
  }

  async startDatabase(): Promise<boolean> {
    const projectPath = this.getProjectPath();
    if (!projectPath) {
      vscode.window.showErrorMessage('Sophia Code is not installed. Run Setup first.');
      return false;
    }

    try {
      await this.terminalService.runCommand(
        'Database',
        isWindows() ? 'docker-compose up database -d' : 'docker-compose up database -d',
        projectPath,
        true
      );
      
      this.serviceStatus.set('database', true);
      
      // Wait for database to initialize
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      vscode.window.showInformationMessage('Database started on port 5432');
      return true;
    } catch (error) {
      vscode.window.showErrorMessage('Failed to start database. Is Docker running?');
      return false;
    }
  }

  async startBackend(): Promise<boolean> {
    const projectPath = this.getProjectPath();
    if (!projectPath) {
      vscode.window.showErrorMessage('Sophia Code is not installed. Run Setup first.');
      return false;
    }

    try {
      const backendPath = path.join(projectPath, 'backend');
      
      await this.terminalService.runCommand(
        'Backend',
        'npm run start:dev',
        backendPath,
        true
      );
      
      this.serviceStatus.set('backend', true);
      
      vscode.window.showInformationMessage('Backend starting on http://localhost:3000');
      return true;
    } catch (error) {
      vscode.window.showErrorMessage('Failed to start backend.');
      return false;
    }
  }

  async startFrontend(): Promise<boolean> {
    const projectPath = this.getProjectPath();
    if (!projectPath) {
      vscode.window.showErrorMessage('Sophia Code is not installed. Run Setup first.');
      return false;
    }

    try {
      await this.terminalService.runCommand(
        'Frontend',
        'npm run dev',
        projectPath,
        true
      );
      
      this.serviceStatus.set('frontend', true);
      
      vscode.window.showInformationMessage('Frontend starting on http://localhost:5173');
      return true;
    } catch (error) {
      vscode.window.showErrorMessage('Failed to start frontend.');
      return false;
    }
  }

  async startAll(): Promise<boolean> {
    const projectPath = this.getProjectPath();
    if (!projectPath) {
      vscode.window.showErrorMessage('Sophia Code is not installed. Run Setup first.');
      return false;
    }

    // Community Edition (SQLite) - No database service needed
    // SQLite is file-based and started automatically by the backend
    
    // Start backend first (creates SQLite DB if needed)
    await this.startBackend();

    // Wait a bit for backend to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start frontend
    await this.startFrontend();

    vscode.window.showInformationMessage(
      'Sophia Code is starting!',
      'Open Dashboard'
    ).then(selection => {
      if (selection === 'Open Dashboard') {
        this.openDashboard();
      }
    });

    return true;
  }

  async stopAll(): Promise<void> {
    // Community Edition - No Docker to stop, just terminate Node processes
    // Dispose terminals (this stops the processes)
    this.terminalService.disposeTerminal('Backend');
    this.terminalService.disposeTerminal('Frontend');

    this.serviceStatus.clear();

    vscode.window.showInformationMessage('Sophia Code stopped.');
  }

  async restartAll(): Promise<void> {
    await this.stopAll();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.startAll();
  }

  openDashboard(): void {
    const dashboardUrl = 'http://localhost:5173';
    vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
  }

  openBackendApi(): void {
    const apiUrl = 'http://localhost:3000/api';
    vscode.env.openExternal(vscode.Uri.parse(apiUrl));
  }

  getServiceStatus(): ServiceStatus[] {
    const projectPath = this.getProjectPath();
    if (!projectPath) {
      return [];
    }

    // Community Edition - SQLite (no separate database service)
    return [
      {
        name: 'Backend API',
        running: this.serviceStatus.get('backend') || false,
        port: 3000,
        url: 'http://localhost:3000'
      },
      {
        name: 'Frontend',
        running: this.serviceStatus.get('frontend') || false,
        port: 5173,
        url: 'http://localhost:5173'
      },
      {
        name: 'Database (SQLite)',
        running: this.serviceStatus.get('backend') || false, // SQLite runs with backend
        description: 'File-based (no Docker required)'
      }
    ];
  }

  showLogs(service: string): void {
    this.terminalService.showOutput();
  }
}
