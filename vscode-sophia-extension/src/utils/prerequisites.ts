import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getPlatform, isWindows, getDockerDownloadUrl, getNodeDownloadUrl, getGitDownloadUrl } from './platform';

const execAsync = promisify(exec);

export interface PrerequisiteCheck {
  name: string;
  installed: boolean;
  version?: string;
  requiredVersion?: string;
  installUrl: string;
  error?: string;
}

export interface PrerequisitesResult {
  allInstalled: boolean;
  checks: PrerequisiteCheck[];
}

async function runCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    return await execAsync(command, { timeout: 10000 });
  } catch (error) {
    throw error;
  }
}

export async function checkNode(): Promise<PrerequisiteCheck> {
  try {
    const { stdout } = await runCommand('node --version');
    const version = stdout.trim().replace('v', '');
    const majorVersion = parseInt(version.split('.')[0]);
    const requiredVersion = 18;
    
    return {
      name: 'Node.js',
      installed: majorVersion >= requiredVersion,
      version: stdout.trim(),
      requiredVersion: `>= ${requiredVersion}`,
      installUrl: getNodeDownloadUrl()
    };
  } catch (error) {
    return {
      name: 'Node.js',
      installed: false,
      installUrl: getNodeDownloadUrl(),
      error: 'Node.js is not installed or not in PATH'
    };
  }
}

export async function checkGit(): Promise<PrerequisiteCheck> {
  try {
    const { stdout } = await runCommand('git --version');
    return {
      name: 'Git',
      installed: true,
      version: stdout.trim(),
      installUrl: getGitDownloadUrl()
    };
  } catch (error) {
    return {
      name: 'Git',
      installed: false,
      installUrl: getGitDownloadUrl(),
      error: 'Git is not installed or not in PATH'
    };
  }
}

export async function checkDocker(): Promise<PrerequisiteCheck> {
  try {
    // First check if docker command exists
    const { stdout: versionOutput } = await runCommand('docker --version');
    
    // Then check if docker daemon is running
    try {
      await runCommand('docker ps');
      return {
        name: 'Docker',
        installed: true,
        version: versionOutput.trim(),
        installUrl: getDockerDownloadUrl()
      };
    } catch (error) {
      return {
        name: 'Docker',
        installed: true,
        version: versionOutput.trim(),
        installUrl: getDockerDownloadUrl(),
        error: 'Docker is installed but not running. Please start Docker Desktop.'
      };
    }
  } catch (error) {
    return {
      name: 'Docker',
      installed: false,
      installUrl: getDockerDownloadUrl(),
      error: 'Docker is not installed'
    };
  }
}

export async function checkDockerCompose(): Promise<PrerequisiteCheck> {
  try {
    // Try "docker compose" (v2) first, then "docker-compose" (v1)
    try {
      const { stdout } = await runCommand('docker compose version');
      return {
        name: 'Docker Compose',
        installed: true,
        version: stdout.trim(),
        installUrl: getDockerDownloadUrl()
      };
    } catch {
      const { stdout } = await runCommand('docker-compose --version');
      return {
        name: 'Docker Compose',
        installed: true,
        version: stdout.trim(),
        installUrl: getDockerDownloadUrl()
      };
    }
  } catch (error) {
    return {
      name: 'Docker Compose',
      installed: false,
      installUrl: getDockerDownloadUrl(),
      error: 'Docker Compose is not installed'
    };
  }
}

export async function checkAllPrerequisites(isCommunityEdition: boolean = true): Promise<PrerequisitesResult> {
  // Community Edition only requires Node.js and Git
  // Docker is only needed for Paid (multi-user) version
  const checks = await Promise.all([
    checkNode(),
    checkGit(),
    ...(isCommunityEdition ? [] : [checkDocker(), checkDockerCompose()])
  ]);

  const allInstalled = checks.every(c => c.installed && !c.error);

  return {
    allInstalled,
    checks
  };
}

export function getInstallInstructions(check: PrerequisiteCheck): string {
  const platform = getPlatform();
  
  switch (check.name) {
    case 'Node.js':
      if (isWindows()) {
        return `1. Download the installer from ${check.installUrl}\n2. Run the .msi file and follow the prompts\n3. Restart VS Code after installation`;
      }
      return `1. Visit ${check.installUrl}\n2. Download and install the package\n3. Restart VS Code`;
    
    case 'Git':
      if (isWindows()) {
        return `1. Download from ${check.installUrl}\n2. Run the installer\n3. Select "Git from the command line and also from 3rd-party software" when asked about PATH\n4. Complete the installation and restart VS Code`;
      }
      return `1. Visit ${check.installUrl}\n2. Follow the installation instructions for your OS`;
    
    case 'Docker':
      return `1. Download Docker Desktop from ${check.installUrl}\n2. Run the installer\n3. Restart your computer when prompted\n4. Open Docker Desktop and wait for it to start\n5. Return to VS Code and click "Check Again"`;
    
    default:
      return `Visit ${check.installUrl} to install ${check.name}`;
  }
}

export async function showPrerequisitesReport(result: PrerequisitesResult): Promise<void> {
  const items = result.checks.map(check => {
    const icon = check.installed && !check.error ? '✅' : '❌';
    const warning = check.error ? ` ⚠️ ${check.error}` : '';
    return `${icon} ${check.name}${check.version ? `: ${check.version}` : ''}${warning}`;
  });

  const message = items.join('\n');
  
  if (result.allInstalled) {
    await vscode.window.showInformationMessage(
      'All prerequisites are installed!\n\n' + message,
      { modal: false },
      'Continue Setup'
    );
  } else {
    const action = await vscode.window.showWarningMessage(
      'Some prerequisites are missing:\n\n' + message,
      { modal: false },
      'View Install Instructions',
      'Check Again'
    );
    
    if (action === 'View Install Instructions') {
      const missing = result.checks.filter(c => !c.installed || c.error);
      const instructions = missing.map(getInstallInstructions).join('\n\n');
      
      const doc = await vscode.workspace.openTextDocument({
        content: `# Install Missing Prerequisites\n\n${instructions}`,
        language: 'markdown'
      });
      await vscode.window.showTextDocument(doc);
    }
  }
}
