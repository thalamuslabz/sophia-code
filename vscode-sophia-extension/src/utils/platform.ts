import * as os from 'os';
import * as path from 'path';

export type Platform = 'win32' | 'darwin' | 'linux';

export const getPlatform = (): Platform => process.platform as Platform;

export const isWindows = (): boolean => getPlatform() === 'win32';
export const isMac = (): boolean => getPlatform() === 'darwin';
export const isLinux = (): boolean => getPlatform() === 'linux';

export const getShell = (): string => {
  switch (getPlatform()) {
    case 'win32':
      return 'powershell.exe';
    case 'darwin':
      return process.env.SHELL || '/bin/zsh';
    case 'linux':
      return process.env.SHELL || '/bin/bash';
  }
};

export const normalizePath = (p: string): string => {
  if (isWindows()) {
    return p.replace(/\//g, '\\');
  }
  return p;
};

export const getHomeDir = (): string => {
  return os.homedir();
};

export const getDefaultInstallPath = (): string => {
  const home = getHomeDir();
  switch (getPlatform()) {
    case 'win32':
      return path.join(home, 'Documents', 'sophia-code');
    case 'darwin':
    case 'linux':
      return path.join(home, 'sophia-code');
  }
};

export const getDockerDownloadUrl = (): string => {
  switch (getPlatform()) {
    case 'win32':
      return 'https://www.docker.com/products/docker-desktop/';
    case 'darwin':
      return 'https://www.docker.com/products/docker-desktop/';
    case 'linux':
      return 'https://docs.docker.com/engine/install/';
  }
};

export const getNodeDownloadUrl = (): string => {
  switch (getPlatform()) {
    case 'win32':
      return 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi';
    case 'darwin':
      return 'https://nodejs.org/dist/v20.11.0/node-v20.11.0.pkg';
    case 'linux':
      return 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz';
  }
};

export const getGitDownloadUrl = (): string => {
  switch (getPlatform()) {
    case 'win32':
      return 'https://git-scm.com/download/win';
    case 'darwin':
      return 'https://git-scm.com/download/mac';
    case 'linux':
      return 'https://git-scm.com/download/linux';
  }
};

export const quotePath = (p: string): string => {
  if (isWindows()) {
    return `"${p}"`;
  }
  return `'${p}'`;
};

export const joinCommands = (...commands: string[]): string => {
  if (isWindows()) {
    return commands.join('; ');
  }
  return commands.join(' && ');
};

export const changeDirCommand = (dir: string): string => {
  const normalized = normalizePath(dir);
  if (isWindows()) {
    return `cd ${quotePath(normalized)}`;
  }
  return `cd ${quotePath(normalized)}`;
};
