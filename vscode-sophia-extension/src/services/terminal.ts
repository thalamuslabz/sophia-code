import * as vscode from 'vscode';
import { isWindows, normalizePath } from '../utils/platform';

export class TerminalService {
  private terminals: Map<string, vscode.Terminal> = new Map();
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('Sophia Code');
  }

  private getTerminal(name: string): vscode.Terminal {
    if (!this.terminals.has(name)) {
      const terminal = vscode.window.createTerminal({
        name: `Sophia: ${name}`,
        shellPath: isWindows() ? 'powershell.exe' : undefined
      });
      this.terminals.set(name, terminal);
    }
    return this.terminals.get(name)!;
  }

  async runCommand(
    terminalName: string,
    command: string,
    cwd?: string,
    showOutput: boolean = true
  ): Promise<void> {
    const terminal = this.getTerminal(terminalName);
    
    if (cwd) {
      const cdCommand = isWindows() 
        ? `cd "${normalizePath(cwd)}"`
        : `cd "${cwd}"`;
      terminal.sendText(cdCommand, true);
    }
    
    terminal.sendText(command, true);
    
    if (showOutput) {
      terminal.show();
    }
    
    this.outputChannel.appendLine(`[${terminalName}] ${command}`);
  }

  async runSequence(
    terminalName: string,
    commands: { command: string; cwd?: string; waitFor?: string; timeout?: number }[],
    onProgress?: (step: number, total: number, message: string) => void
  ): Promise<boolean> {
    const terminal = this.getTerminal(terminalName);
    terminal.show();
    
    for (let i = 0; i < commands.length; i++) {
      const { command, cwd } = commands[i];
      
      if (onProgress) {
        onProgress(i + 1, commands.length, `Running: ${command}`);
      }
      
      if (cwd) {
        const cdCommand = isWindows() 
          ? `cd "${normalizePath(cwd)}"`
          : `cd "${cwd}"`;
        terminal.sendText(cdCommand, true);
      }
      
      terminal.sendText(command, true);
      
      // Small delay between commands
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return true;
  }

  disposeTerminal(name: string): void {
    const terminal = this.terminals.get(name);
    if (terminal) {
      terminal.dispose();
      this.terminals.delete(name);
    }
  }

  disposeAll(): void {
    this.terminals.forEach(terminal => terminal.dispose());
    this.terminals.clear();
  }

  showOutput(): void {
    this.outputChannel.show();
  }

  log(message: string): void {
    this.outputChannel.appendLine(message);
  }
}
