import * as vscode from 'vscode';
import { ServiceManager, ServiceStatus } from '../services/serviceManager';

export class ControlCenterProvider implements vscode.TreeDataProvider<ControlCenterItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ControlCenterItem | undefined | null | void> = new vscode.EventEmitter<ControlCenterItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ControlCenterItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private serviceManager: ServiceManager;

  constructor(context: vscode.ExtensionContext) {
    this.serviceManager = new ServiceManager(context);
    
    // Refresh every 5 seconds
    setInterval(() => {
      this.refresh();
    }, 5000);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ControlCenterItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ControlCenterItem): Thenable<ControlCenterItem[]> {
    if (!element) {
      return Promise.resolve(this.getRootItems());
    }

    if (element.contextValue === 'services') {
      return Promise.resolve(this.getServiceItems());
    }

    if (element.contextValue === 'actions') {
      return Promise.resolve(this.getActionItems());
    }

    return Promise.resolve([]);
  }

  private getRootItems(): ControlCenterItem[] {
    return [
      new ControlCenterItem(
        'Quick Actions',
        vscode.TreeItemCollapsibleState.Expanded,
        'actions',
        undefined,
        '$(play)'
      ),
      new ControlCenterItem(
        'Services',
        vscode.TreeItemCollapsibleState.Expanded,
        'services',
        undefined,
        '$(server)'
      ),
      new ControlCenterItem(
        'Open Dashboard',
        vscode.TreeItemCollapsibleState.None,
        'openDashboard',
        {
          command: 'sophia.openDashboard',
          title: 'Open Dashboard'
        },
        '$(globe)'
      )
    ];
  }

  private getActionItems(): ControlCenterItem[] {
    return [
      new ControlCenterItem(
        'Start All Services',
        vscode.TreeItemCollapsibleState.None,
        'startAll',
        {
          command: 'sophia.startServices',
          title: 'Start All'
        },
        '$(play)'
      ),
      new ControlCenterItem(
        'Stop All Services',
        vscode.TreeItemCollapsibleState.None,
        'stopAll',
        {
          command: 'sophia.stopServices',
          title: 'Stop All'
        },
        '$(stop)'
      ),
      new ControlCenterItem(
        'Restart Services',
        vscode.TreeItemCollapsibleState.None,
        'restartAll',
        {
          command: 'sophia.restartServices',
          title: 'Restart'
        },
        '$(refresh)'
      )
    ];
  }

  private getServiceItems(): ControlCenterItem[] {
    const services = this.serviceManager.getServiceStatus();
    
    if (services.length === 0) {
      return [
        new ControlCenterItem(
          'Not installed',
          vscode.TreeItemCollapsibleState.None,
          'notInstalled',
          undefined,
          '$(circle-slash)'
        )
      ];
    }

    return services.map(service => {
      const icon = service.running ? '$(check)' : '$(x)';
      const label = service.running 
        ? `${service.name} (${service.port})`
        : service.name;
      
      return new ControlCenterItem(
        label,
        vscode.TreeItemCollapsibleState.None,
        'service',
        service.url ? {
          command: 'vscode.open',
          title: 'Open',
          arguments: [vscode.Uri.parse(service.url)]
        } : undefined,
        icon
      );
    });
  }
}

class ControlCenterItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly command?: vscode.Command,
    iconPath?: string
  ) {
    super(label, collapsibleState);
    
    if (iconPath) {
      this.iconPath = new vscode.ThemeIcon(iconPath.replace(/\$\(/g, '').replace(/\)/g, ''));
    }
  }
}
