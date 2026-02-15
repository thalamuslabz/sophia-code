import * as vscode from 'vscode';
import { SetupService, SetupOptions, SetupProgress } from '../services/setup';
import { getDefaultInstallPath } from '../utils/platform';
import { PrerequisitesResult, PrerequisiteCheck } from '../utils/prerequisites';

export class SetupWizard {
  private panel: vscode.WebviewPanel | undefined;
  private setupService: SetupService;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.setupService = new SetupService(context);
  }

  async open(): Promise<void> {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'sophiaSetupWizard',
      'Sophia Code Setup',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    this.panel.webview.html = this.getWelcomeHtml();

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    this.panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'checkPrerequisites':
          await this.handleCheckPrerequisites();
          break;
        case 'startSetup':
          await this.handleStartSetup(message.data);
          break;
        case 'startServices':
          await this.handleStartServices();
          break;
        case 'openDashboard':
          vscode.env.openExternal(vscode.Uri.parse('http://localhost:5173'));
          break;
        case 'browseFolder':
          const result = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            defaultUri: vscode.Uri.file(getDefaultInstallPath())
          });
          if (result && result.length > 0) {
            this.panel?.webview.postMessage({
              command: 'folderSelected',
              path: result[0].fsPath
            });
          }
          break;
      }
    });
  }

  private async handleCheckPrerequisites(): Promise<void> {
    this.panel?.webview.postMessage({
      command: 'checkingPrerequisites'
    });

    // Community Edition only checks Node.js and Git (no Docker required)
    const result = await this.setupService.checkPrerequisites(true);
    
    this.panel?.webview.postMessage({
      command: 'prerequisitesResult',
      result
    });
  }

  private async handleStartSetup(data: { projectName: string; installPath: string; autoStart: boolean }): Promise<void> {
    const options: SetupOptions = {
      projectName: data.projectName,
      installPath: data.installPath,
      autoStart: data.autoStart
    };

    const success = await this.setupService.runSetup(
      options,
      (progress: SetupProgress) => {
        this.panel?.webview.postMessage({
          command: 'setupProgress',
          progress
        });
      }
    );

    if (success) {
      this.panel?.webview.postMessage({
        command: 'setupComplete'
      });
      
      // Update context
      await vscode.commands.executeCommand('setContext', 'sophia:installed', true);
      
      if (data.autoStart) {
        await this.handleStartServices();
      }
    }
  }

  private async handleStartServices(): Promise<void> {
    this.panel?.webview.postMessage({
      command: 'startingServices'
    });

    const { ServiceManager } = await import('../services/serviceManager');
    const serviceManager = new ServiceManager(this.context);
    
    const success = await serviceManager.startAll();
    
    if (success) {
      this.panel?.webview.postMessage({
        command: 'servicesStarted'
      });
    }
  }

  private getWelcomeHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sophia Code Setup</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      background: #1e1e1e;
      color: #cccccc;
    }
    h1 {
      color: #4ec9b0;
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #9cdcfe;
      font-size: 1.2em;
      margin-bottom: 40px;
    }
    .card {
      background: #252526;
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 20px;
      border: 1px solid #3c3c3c;
    }
    .card h2 {
      color: #4ec9b0;
      margin-top: 0;
    }
    button {
      background: #0e639c;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin: 5px;
      transition: background 0.2s;
    }
    button:hover {
      background: #1177bb;
    }
    button:disabled {
      background: #3c3c3c;
      cursor: not-allowed;
    }
    button.secondary {
      background: #3c3c3c;
    }
    button.secondary:hover {
      background: #4c4c4c;
    }
    .prereq-item {
      display: flex;
      align-items: center;
      padding: 10px;
      margin: 5px 0;
      background: #1e1e1e;
      border-radius: 4px;
    }
    .prereq-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      font-weight: bold;
    }
    .prereq-icon.success {
      background: #4ec9b0;
      color: #1e1e1e;
    }
    .prereq-icon.error {
      background: #f44336;
      color: white;
    }
    .prereq-icon.pending {
      background: #ffc107;
      color: #1e1e1e;
    }
    .input-group {
      margin: 20px 0;
    }
    .input-group label {
      display: block;
      margin-bottom: 8px;
      color: #9cdcfe;
    }
    .input-group input {
      width: 100%;
      padding: 10px;
      background: #3c3c3c;
      border: 1px solid #555;
      color: #ccc;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }
    .input-row {
      display: flex;
      gap: 10px;
    }
    .input-row input {
      flex: 1;
    }
    .progress-bar {
      width: 100%;
      height: 20px;
      background: #3c3c3c;
      border-radius: 10px;
      overflow: hidden;
      margin: 20px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #0e639c, #4ec9b0);
      transition: width 0.3s ease;
    }
    .hidden {
      display: none;
    }
    .step-indicator {
      display: flex;
      justify-content: center;
      margin-bottom: 30px;
    }
    .step {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 10px;
      background: #3c3c3c;
      font-weight: bold;
    }
    .step.active {
      background: #0e639c;
      color: white;
    }
    .step.complete {
      background: #4ec9b0;
      color: #1e1e1e;
    }
    .step-line {
      width: 50px;
      height: 2px;
      background: #3c3c3c;
      align-self: center;
    }
    .success-message {
      text-align: center;
      padding: 40px;
    }
    .success-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    .checkbox-group {
      margin: 20px 0;
    }
    .checkbox-group label {
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    .checkbox-group input[type="checkbox"] {
      margin-right: 10px;
      width: 18px;
      height: 18px;
    }
  </style>
</head>
<body>
  <div id="welcome-section">
    <h1>🛡️ Sophia Code</h1>
    <p class="subtitle">Community Edition - AI Governance for Vibe Coding</p>
    
    <div class="card">
      <h2>Welcome!</h2>
      <p>Sophia Code helps you build applications with built-in governance guardrails. This is the <strong>Community Edition</strong> - completely free for single users!</p>
      
      <div style="background: #1e1e1e; padding: 15px; border-radius: 4px; margin: 15px 0;">
        <strong>✨ Community Edition Features:</strong>
        <ul style="margin: 10px 0;">
          <li>✅ Full governance guardrails</li>
          <li>✅ AI-powered code review</li>
          <li>✅ Mission tracking & artifacts</li>
          <li>✅ Trust score monitoring</li>
          <li>✅ <strong>No Docker required!</strong></li>
        </ul>
      </div>

      <p><strong>What you'll need:</strong> VS Code, Node.js, and Git</p>
      <p><strong>Estimated time:</strong> 3-5 minutes</p>
      <br>
      <button onclick="checkPrerequisites()">Start Setup</button>
      <button class="secondary" onclick="showManualInstructions()">Manual Setup Guide</button>
    </div>
  </div>

  <div id="prereq-section" class="hidden">
    <div class="step-indicator">
      <div class="step active">1</div>
      <div class="step-line"></div>
      <div class="step">2</div>
      <div class="step-line"></div>
      <div class="step">3</div>
    </div>

    <div class="card">
      <h2>Checking Prerequisites</h2>
      <p>Community Edition requires <strong>Node.js</strong> and <strong>Git</strong>. No Docker needed!</p>
      
      <div id="prereq-list">
        <div class="prereq-item">
          <div class="prereq-icon pending">⏳</div>
          <div>Checking Node.js...</div>
        </div>
        <div class="prereq-item">
          <div class="prereq-icon pending">⏳</div>
          <div>Checking Git...</div>
        </div>
      </div>

      <div id="prereq-actions" class="hidden">
        <p style="color: #f44336;">Some prerequisites are missing. Please install them and try again.</p>
        <button onclick="checkPrerequisites()">Check Again</button>
        <button class="secondary" onclick="showInstallHelp()">View Install Help</button>
      </div>

      <div id="prereq-success" class="hidden">
        <p style="color: #4ec9b0;">✅ All prerequisites are installed!</p>
        <p style="color: #808080; font-size: 12px; margin-top: 10px;">✨ SQLite database will be used (no Docker required)</p>
        <button onclick="showSetupForm()">Continue to Setup</button>
      </div>
    </div>
  </div>

  <div id="setup-section" class="hidden">
    <div class="step-indicator">
      <div class="step complete">1</div>
      <div class="step-line"></div>
      <div class="step active">2</div>
      <div class="step-line"></div>
      <div class="step">3</div>
    </div>

    <div class="card">
      <h2>Configure Your Project</h2>
      
      <div class="input-group">
        <label>Project Name</label>
        <input type="text" id="project-name" value="my-sophia-project" placeholder="my-sophia-project">
      </div>

      <div class="input-group">
        <label>Install Location</label>
        <div class="input-row">
          <input type="text" id="install-path" value="${getDefaultInstallPath()}" placeholder="C:\\Users\\...">
          <button onclick="browseFolder()">Browse...</button>
        </div>
      </div>

      <div class="checkbox-group">
        <label>
          <input type="checkbox" id="auto-start" checked>
          Automatically start services after setup
        </label>
      </div>

      <button onclick="startSetup()">Start Installation</button>
      <button class="secondary" onclick="goBack()">Back</button>
    </div>
  </div>

  <div id="progress-section" class="hidden">
    <div class="step-indicator">
      <div class="step complete">1</div>
      <div class="step-line"></div>
      <div class="step complete">2</div>
      <div class="step-line"></div>
      <div class="step active">3</div>
    </div>

    <div class="card">
      <h2>Installing Sophia Code</h2>
      
      <div class="progress-bar">
        <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
      </div>
      
      <p id="progress-message">Preparing installation...</p>
      <p id="progress-details" style="color: #808080; font-size: 12px;"></p>

      <div id="terminal-output" style="background: #1e1e1e; padding: 15px; border-radius: 4px; margin-top: 20px; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto;">
        <div style="color: #808080;">Installation in progress...</div>
      </div>
    </div>
  </div>

  <div id="complete-section" class="hidden">
    <div class="step-indicator">
      <div class="step complete">1</div>
      <div class="step-line"></div>
      <div class="step complete">2</div>
      <div class="step-line"></div>
      <div class="step complete">3</div>
    </div>

    <div class="card success-message">
      <div class="success-icon">🎉</div>
      <h2>Setup Complete!</h2>
      <p>Sophia Code <strong>Community Edition</strong> has been installed successfully.</p>
      
      <div style="background: #1e1e1e; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: left;">
        <strong>✅ What's Ready:</strong>
        <ul style="margin: 10px 0;">
          <li>SQLite database (file-based, no Docker!)</li>
          <li>Backend API on port 3000</li>
          <li>Frontend dashboard on port 5173</li>
          <li>All governance features enabled</li>
        </ul>
      </div>
      
      <div id="services-status" class="hidden" style="margin: 30px 0;">
        <p style="color: #4ec9b0;">✅ All services are running!</p>
        <p>Frontend: <a href="http://localhost:5173" style="color: #4ec9b0;">http://localhost:5173</a></p>
        <p>Backend API: <a href="http://localhost:3000" style="color: #4ec9b0;">http://localhost:3000</a></p>
      </div>

      <div style="margin-top: 30px;">
        <button onclick="openDashboard()">Open Sophia Dashboard</button>
        <button class="secondary" onclick="startServices()">Start Services</button>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function checkPrerequisites() {
      showSection('prereq-section');
      vscode.postMessage({ command: 'checkPrerequisites' });
    }

    function showSetupForm() {
      showSection('setup-section');
    }

    function startSetup() {
      const projectName = document.getElementById('project-name').value;
      const installPath = document.getElementById('install-path').value;
      const autoStart = document.getElementById('auto-start').checked;

      if (!projectName || !installPath) {
        alert('Please fill in all fields');
        return;
      }

      showSection('progress-section');
      vscode.postMessage({
        command: 'startSetup',
        data: { projectName, installPath, autoStart }
      });
    }

    function startServices() {
      showSection('progress-section');
      document.getElementById('progress-message').textContent = 'Starting services...';
      vscode.postMessage({ command: 'startServices' });
    }

    function openDashboard() {
      vscode.postMessage({ command: 'openDashboard' });
    }

    function browseFolder() {
      vscode.postMessage({ command: 'browseFolder' });
    }

    function goBack() {
      showSection('prereq-section');
    }

    function showManualInstructions() {
      vscode.postMessage({ command: 'openManualGuide' });
    }

    function showInstallHelp() {
      vscode.postMessage({ command: 'showInstallHelp' });
    }

    function showSection(sectionId) {
      document.querySelectorAll('[id$="-section"]').forEach(el => {
        el.classList.add('hidden');
      });
      document.getElementById(sectionId).classList.remove('hidden');
    }

    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.command) {
        case 'checkingPrerequisites':
          // Already showing loading state
          break;

        case 'prerequisitesResult':
          updatePrerequisitesList(message.result);
          break;

        case 'folderSelected':
          document.getElementById('install-path').value = message.path;
          break;

        case 'setupProgress':
          updateProgress(message.progress);
          break;

        case 'setupComplete':
          showSection('complete-section');
          break;

        case 'servicesStarted':
          document.getElementById('services-status').classList.remove('hidden');
          showSection('complete-section');
          break;
      }
    });

    function updatePrerequisitesList(result) {
      const list = document.getElementById('prereq-list');
      list.innerHTML = '';

      result.checks.forEach(check => {
        const item = document.createElement('div');
        item.className = 'prereq-item';
        
        const iconClass = check.installed && !check.error ? 'success' : 'error';
        const icon = check.installed && !check.error ? '✓' : '✗';
        
        item.innerHTML = \`
          <div class="prereq-icon \${iconClass}">\${icon}</div>
          <div>
            <div>\${check.name}</div>
            <div style="font-size: 12px; color: #808080;">
              \${check.version || check.error || 'Not installed'}
            </div>
          </div>
        \`;
        
        list.appendChild(item);
      });

      if (result.allInstalled) {
        document.getElementById('prereq-success').classList.remove('hidden');
        document.getElementById('prereq-actions').classList.add('hidden');
      } else {
        document.getElementById('prereq-success').classList.add('hidden');
        document.getElementById('prereq-actions').classList.remove('hidden');
      }
    }

    function updateProgress(progress) {
      const percentage = (progress.step / progress.totalSteps) * 100;
      document.getElementById('progress-fill').style.width = percentage + '%';
      document.getElementById('progress-message').textContent = progress.message;
      document.getElementById('progress-details').textContent = progress.details || '';
      
      const terminal = document.getElementById('terminal-output');
      const line = document.createElement('div');
      line.textContent = \`[\${progress.step}/\${progress.totalSteps}] \${progress.message}\`;
      terminal.appendChild(line);
      terminal.scrollTop = terminal.scrollHeight;
    }
  </script>
</body>
</html>`;
  }

  dispose(): void {
    this.setupService.dispose();
    this.panel?.dispose();
  }
}
