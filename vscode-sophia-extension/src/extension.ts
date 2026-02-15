import * as vscode from 'vscode';
import { SetupWizard } from './ui/setupWizard';
import { ControlCenterProvider } from './ui/controlCenter';
import { SetupService } from './services/setup';
import { ServiceManager } from './services/serviceManager';
import { showPrerequisitesReport } from './utils/prerequisites';

let setupWizard: SetupWizard | undefined;
let controlCenterProvider: ControlCenterProvider | undefined;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('Sophia Code extension is now active');

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'sophia.openSetupWizard';
  updateStatusBar(context);
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Register Control Center tree view
  controlCenterProvider = new ControlCenterProvider(context);
  vscode.window.registerTreeDataProvider('sophia.services', controlCenterProvider);

  // Check if Sophia is installed and update context
  const setupService = new SetupService(context);
  const isInstalled = setupService.isInstalled();
  vscode.commands.executeCommand('setContext', 'sophia:installed', isInstalled);

  // Register commands
  const commands = [
    vscode.commands.registerCommand('sophia.openSetupWizard', () => {
      setupWizard = new SetupWizard(context);
      setupWizard.open();
    }),

    vscode.commands.registerCommand('sophia.setupEnvironment', async () => {
      setupWizard = new SetupWizard(context);
      setupWizard.open();
    }),

    vscode.commands.registerCommand('sophia.checkPrerequisites', async () => {
      const result = await setupService.checkPrerequisites();
      await showPrerequisitesReport(result);
    }),

    vscode.commands.registerCommand('sophia.startServices', async () => {
      const serviceManager = new ServiceManager(context);
      const success = await serviceManager.startAll();
      if (success) {
        updateStatusBar(context, 'running');
        controlCenterProvider?.refresh();
      }
    }),

    vscode.commands.registerCommand('sophia.stopServices', async () => {
      const serviceManager = new ServiceManager(context);
      await serviceManager.stopAll();
      updateStatusBar(context, 'stopped');
      controlCenterProvider?.refresh();
    }),

    vscode.commands.registerCommand('sophia.restartServices', async () => {
      const serviceManager = new ServiceManager(context);
      await serviceManager.restartAll();
      updateStatusBar(context, 'running');
      controlCenterProvider?.refresh();
    }),

    vscode.commands.registerCommand('sophia.openDashboard', () => {
      const serviceManager = new ServiceManager(context);
      serviceManager.openDashboard();
    }),

    vscode.commands.registerCommand('sophia.createProject', async () => {
      const projectName = await vscode.window.showInputBox({
        prompt: 'Enter project name',
        placeHolder: 'my-sophia-app',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Project name is required';
          }
          if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
            return 'Project name can only contain letters, numbers, hyphens, and underscores';
          }
          return null;
        }
      });

      if (projectName) {
        const installPath = setupService.getInstallPath();
        if (installPath) {
          const projectPath = vscode.Uri.file(installPath + '/../' + projectName);
          await vscode.commands.executeCommand('vscode.openFolder', projectPath, {
            forceNewWindow: false
          });
        }
      }
    }),

    vscode.commands.registerCommand('sophia.showLogs', () => {
      const serviceManager = new ServiceManager(context);
      serviceManager.showLogs('all');
    })
  ];

  commands.forEach(cmd => context.subscriptions.push(cmd));

  // If not installed, show welcome message
  if (!isInstalled) {
    showWelcomeNotification();
  }
}

function updateStatusBar(context: vscode.ExtensionContext, status?: 'running' | 'stopped'): void {
  const setupService = new SetupService(context);
  const isInstalled = setupService.isInstalled();

  if (!isInstalled) {
    statusBarItem.text = '$(shield) Sophia: Setup Required';
    statusBarItem.tooltip = 'Click to set up Sophia Code';
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    return;
  }

  switch (status) {
    case 'running':
      statusBarItem.text = '$(shield) Sophia: Running';
      statusBarItem.tooltip = 'Services are running. Click to open dashboard.';
      statusBarItem.command = 'sophia.openDashboard';
      statusBarItem.backgroundColor = undefined;
      break;
    case 'stopped':
      statusBarItem.text = '$(shield) Sophia: Stopped';
      statusBarItem.tooltip = 'Services are stopped. Click to start.';
      statusBarItem.command = 'sophia.startServices';
      statusBarItem.backgroundColor = undefined;
      break;
    default:
      statusBarItem.text = '$(shield) Sophia Code';
      statusBarItem.tooltip = 'Sophia Code is ready';
      statusBarItem.command = 'sophia.openDashboard';
      statusBarItem.backgroundColor = undefined;
  }
}

function showWelcomeNotification(): void {
  vscode.window.showInformationMessage(
    'Welcome to Sophia Code! Would you like to set up your environment?',
    'Start Setup',
    'Later'
  ).then(selection => {
    if (selection === 'Start Setup') {
      vscode.commands.executeCommand('sophia.openSetupWizard');
    }
  });
}

export function deactivate() {
  setupWizard?.dispose();
}
